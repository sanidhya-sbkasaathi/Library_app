/**
 * Dedicated SQLite WASM + OPFS Web Worker
 * Runs in separate thread with asynchronous non-blocking execution.
 * Interacts with OPFS storage for true persistent offline-first database.
 */

import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { CREATE_TABLES_SQL, SCHEMA_VERSION } from './schema';
import {
  WorkerRequest,
  WorkerResponse,
  StorageInfo,
  TableCountInfo,
} from './sqliteTypes';

let sqlite3Instance: any = null;
let currentDb: any = null;
let currentDbName: string = 'library.db';
let currentLibraryId: string = 'UNBOUND';
let currentDeviceId: string = 'DEVICE-UNKNOWN';
let isOpfsAvailable: boolean = false;
let currentStorageType: 'opfs' | 'memory' | 'kvvfs' = 'memory';

// Promise-based Serial Task Queue to ensure ACID atomicity and prevent locking collisions
let queuePromise: Promise<void> = Promise.resolve();

function enqueueTask<T>(task: () => Promise<T> | T): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    queuePromise = queuePromise
      .then(async () => {
        try {
          const res = await task();
          resolve(res);
        } catch (err) {
          reject(err);
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * Initialize SQLite WASM Module
 */
async function initSqlite() {
  if (sqlite3Instance) return sqlite3Instance;

  sqlite3Instance = await (sqlite3InitModule as any)({
    print: (msg: any) => console.log('[SQLite-WASM Worker]', msg),
    printErr: (err: any) => console.error('[SQLite-WASM Worker Error]', err),
    locateFile: (file: string) => `/${file}`,
  });

  return sqlite3Instance;
}

/**
 * Open or create the local database file.
 * If OPFS is available, uses sqlite3.oo1.OpfsDb for true persistent filesystem storage.
 * If OPFS is not available in the environment, gracefully falls back to sqlite3.oo1.DB.
 */
async function openDatabase(libraryId: string = 'UNBOUND', deviceId: string = 'DEV-001', forceMemory: boolean = false) {
  const sqlite3 = await initSqlite();

  // Close existing DB if different library
  if (currentDb) {
    try {
      currentDb.close();
    } catch (e) {
      console.warn('Error closing previous db:', e);
    }
    currentDb = null;
  }

  currentLibraryId = libraryId;
  currentDeviceId = deviceId;
  currentDbName = libraryId === 'UNBOUND' ? 'library.db' : `library_${libraryId}.db`;

  // Check OPFS availability
  isOpfsAvailable = Boolean('opfs' in sqlite3 && typeof sqlite3.oo1?.OpfsDb === 'function');

  if (isOpfsAvailable && !forceMemory) {
    try {
      const opfsPath = `/${currentDbName}`;
      currentDb = new sqlite3.oo1.OpfsDb(opfsPath);
      currentStorageType = 'opfs';
      console.log(`[SQLite Worker] Successfully opened OPFS database: ${opfsPath}`);
    } catch (opfsErr) {
      console.warn('[SQLite Worker] OPFS open failed, falling back to memory/kvvfs:', opfsErr);
      currentDb = new sqlite3.oo1.DB(currentDbName, 'c');
      currentStorageType = 'memory';
    }
  } else {
    currentDb = new sqlite3.oo1.DB(currentDbName, 'c');
    currentStorageType = 'memory';
    console.log(`[SQLite Worker] Opened standard database: ${currentDbName}`);
  }

  // Configure pragmas
  try {
    currentDb.exec('PRAGMA foreign_keys = ON;');
  } catch {
    // ignore
  }

  // Check if existing data exists in OPFS to restore
  await tryRestoreFromOpfs();

  // Initialize Schema Tables
  for (const statement of CREATE_TABLES_SQL) {
    try {
      currentDb.exec(statement);
    } catch (schemaErr: any) {
      console.error('[SQLite Worker] Schema init statement error:', statement, schemaErr);
    }
  }

  // Record Schema Migration version
  try {
    const existingVer = queryRows(
      'SELECT version FROM schema_migrations WHERE version = ?',
      [SCHEMA_VERSION]
    );
    if (!existingVer || existingVer.length === 0) {
      currentDb.exec({
        sql: 'INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)',
        bind: [SCHEMA_VERSION, 'initial_relational_schema', new Date().toISOString()],
      });
    }
  } catch (e) {
    console.warn('[SQLite Worker] Migration record error:', e);
  }

  // Ensure sync_metadata has entry for this library
  try {
    const existingMeta = queryRows(
      'SELECT library_id FROM sync_metadata WHERE library_id = ?',
      [currentLibraryId]
    );
    if (!existingMeta || existingMeta.length === 0) {
      currentDb.exec({
        sql: `INSERT INTO sync_metadata (library_id, device_id, schema_version) VALUES (?, ?, ?)`,
        bind: [currentLibraryId, currentDeviceId, SCHEMA_VERSION],
      });
    }
  } catch (e) {
    console.warn('[SQLite Worker] sync_metadata record error:', e);
  }

  // Sync initial schema snapshot to OPFS
  await syncToOpfs();

  return getStorageInfo();
}

/**
 * Persists SQLite WASM database binary into Origin Private File System (OPFS)
 * root folder so it appears in OPFS Explorer extension and persists offline.
 */
async function syncToOpfs(): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.storage?.getDirectory || !currentDb) return;
  try {
    if (sqlite3Instance?.capi?.sqlite3_js_db_export) {
      const uint8 = sqlite3Instance.capi.sqlite3_js_db_export(currentDb);
      if (uint8 && uint8.byteLength > 0) {
        const root = await navigator.storage.getDirectory();
        const fileHandle = await root.getFileHandle(currentDbName, { create: true });
        if (typeof (fileHandle as any).createWritable === 'function') {
          const writable = await (fileHandle as any).createWritable();
          await writable.write(uint8);
          await writable.close();
        } else if (typeof (fileHandle as any).createSyncAccessHandle === 'function') {
          const syncHandle = await (fileHandle as any).createSyncAccessHandle();
          syncHandle.truncate(0);
          syncHandle.write(uint8, { at: 0 });
          syncHandle.flush();
          syncHandle.close();
        }
      }
    }
  } catch (err) {
    console.warn('[SQLite Worker] OPFS persistence sync note:', err);
  }
}

/**
 * Attempts to restore database binary from OPFS on startup
 */
async function tryRestoreFromOpfs(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage?.getDirectory || !currentDb) return false;
  try {
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle(currentDbName, { create: false });
    const file = await fileHandle.getFile();
    const arrayBuffer = await file.arrayBuffer();
    if (arrayBuffer.byteLength > 0 && sqlite3Instance?.capi?.sqlite3_js_db_deserialize) {
      const uint8 = new Uint8Array(arrayBuffer);
      sqlite3Instance.capi.sqlite3_js_db_deserialize(currentDb, 'main', uint8, uint8.byteLength, uint8.byteLength, 0);
      console.log(`[SQLite Worker] Restored ${uint8.byteLength} bytes from OPFS for ${currentDbName}`);
      return true;
    }
  } catch {
    // File not found or empty, normal for new db
  }
  return false;
}

/**
 * Get Storage Metadata and Diagnostics Information
 */
function getStorageInfo(): StorageInfo {
  return {
    storageType: currentStorageType,
    dbFileName: currentDbName,
    libraryId: currentLibraryId,
    deviceId: currentDeviceId,
    sqliteVersion: sqlite3Instance?.version?.libVersion || '3.53.4',
    opfsAvailable: isOpfsAvailable,
    schemaVersion: SCHEMA_VERSION,
  };
}

/**
 * Helper: Sanitizes bind parameters, converting any undefined values to null
 * so SQLite-wasm never throws bind type errors.
 */
function sanitizeParams(params?: any[]): any[] {
  if (!params || !Array.isArray(params)) return [];
  return params.map(p => (p === undefined ? null : p));
}

/**
 * Execute raw SQL statement (with optional parameter binding)
 */
function executeSql(sql: string, params: any[] = []): { changes: number } {
  if (!currentDb) throw new Error('SQLite database not initialized');
  currentDb.exec({
    sql,
    bind: sanitizeParams(params),
  });
  const changes = currentDb.changes();
  if (changes > 0) {
    syncToOpfs().catch(() => {});
  }
  return { changes };
}

/**
 * Query rows returning array of plain objects
 */
function queryRows<T = any>(sql: string, params: any[] = []): T[] {
  if (!currentDb) throw new Error('SQLite database not initialized');
  const rows: T[] = [];
  currentDb.exec({
    sql,
    bind: sanitizeParams(params),
    rowMode: 'object',
    resultRows: rows,
  });
  return rows;
}

/**
 * Execute multiple statements inside ONE atomic SQLite transaction
 * Used for all entity mutations + sync_outbox writes!
 */
function executeTransaction(statements: Array<{ sql: string; params?: any[] }>): { success: boolean; changes: number } {
  if (!currentDb) throw new Error('SQLite database not initialized');
  
  currentDb.exec('BEGIN IMMEDIATE;');
  let totalChanges = 0;
  try {
    for (const stmt of statements) {
      currentDb.exec({
        sql: stmt.sql,
        bind: sanitizeParams(stmt.params),
      });
      totalChanges += currentDb.changes();
    }
    currentDb.exec('COMMIT;');
    if (totalChanges > 0) {
      syncToOpfs().catch(() => {});
    }
    return { success: true, changes: totalChanges };
  } catch (err) {
    try {
      currentDb.exec('ROLLBACK;');
    } catch {
      // ignore rollback failure
    }
    throw err;
  }
}

/**
 * Get Table Counts for all 22+ tables
 */
function getTableCounts(): TableCountInfo[] {
  if (!currentDb) return [];
  const tableNames = [
    'associations',
    'users',
    'rooms',
    'seats',
    'students',
    'admissions',
    'membership_plans',
    'attendance',
    'payments',
    'lockers',
    'expenses',
    'notices',
    'visitors',
    'complaints',
    'staff',
    'books',
    'book_copies',
    'audit_logs',
    'notifications',
    'devices',
    'sync_outbox',
    'sync_metadata',
    'installation_metadata',
  ];

  const results: TableCountInfo[] = [];
  for (const name of tableNames) {
    try {
      const rows = queryRows<{ count: number }>(`SELECT COUNT(*) as count FROM ${name}`);
      results.push({ name, count: rows[0]?.count || 0 });
    } catch {
      results.push({ name, count: 0 });
    }
  }
  return results;
}

/**
 * Run PRAGMA integrity_check on the SQLite WASM database
 */
function runPragmaCheck(): string {
  if (!currentDb) return 'Database not initialized';
  try {
    const rows = queryRows<{ integrity_check: string }>('PRAGMA integrity_check;');
    return rows.map(r => r.integrity_check || Object.values(r)[0]).join('\n') || 'ok';
  } catch (err: any) {
    return `Error running integrity check: ${err.message}`;
  }
}

// ----------------------------------------------------
// Web Worker Message Listener
// ----------------------------------------------------
self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const req = event.data;
  if (!req || !req.id) return;

  try {
    const result = await enqueueTask(async () => {
      switch (req.action) {
        case 'INIT_DATABASE': {
          const info = await openDatabase(
            req.payload?.libraryId || 'UNBOUND',
            req.payload?.deviceId || 'DEV-001',
            req.payload?.forceMemory || false
          );
          return info;
        }

        case 'EXECUTE_SQL': {
          return executeSql(req.payload?.sql || '', req.payload?.params || []);
        }

        case 'QUERY_ROWS': {
          return queryRows(req.payload?.sql || '', req.payload?.params || []);
        }

        case 'TRANSACTION': {
          return executeTransaction(req.payload?.statements || []);
        }

        case 'GET_TABLE_COUNTS': {
          return getTableCounts();
        }

        case 'PRAGMA_CHECK': {
          return runPragmaCheck();
        }

        case 'GET_STORAGE_INFO': {
          return getStorageInfo();
        }

        case 'EXPORT_DATABASE': {
          if (!currentDb) throw new Error('Database not initialized');
          let byteArray: number[] = [];
          try {
            if (sqlite3Instance?.capi?.sqlite3_js_db_export) {
              const uint8 = sqlite3Instance.capi.sqlite3_js_db_export(currentDb);
              byteArray = Array.from(uint8);
            }
          } catch (e) {
            console.warn('Direct db_export failed:', e);
          }
          return {
            dbFileName: currentDbName,
            byteArray,
            byteLength: byteArray.length,
          };
        }

        case 'CLOSE_DATABASE': {
          if (currentDb) {
            currentDb.close();
            currentDb = null;
          }
          return { closed: true };
        }

        default:
          throw new Error(`Unknown action: ${(req as any).action}`);
      }
    });

    const response: WorkerResponse = {
      id: req.id,
      success: true,
      data: result,
    };
    self.postMessage(response);
  } catch (err: any) {
    console.error(`[SQLite Worker] Error executing action ${req.action}:`, err);
    const response: WorkerResponse = {
      id: req.id,
      success: false,
      error: err.message || String(err),
    };
    self.postMessage(response);
  }
};
