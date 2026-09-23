/**
 * Database Service Layer (Main Thread Bridge)
 * Manages the single controlled SQLite Worker connection, handles locking,
 * and provides typed async repository operations with atomic sync_outbox transactions.
 */

import {
  WorkerRequest,
  WorkerResponse,
  StorageInfo,
  TableCountInfo,
  SqlStatement,
  SyncOutboxRow,
} from './sqliteTypes';

export class DatabaseService {
  private static instance: DatabaseService;
  private worker: Worker | null = null;
  private pendingRequests: Map<string, { resolve: (val: any) => void; reject: (err: any) => void }> = new Map();
  private isInitialized = false;
  private currentLibraryId = 'UNBOUND';
  private currentDeviceId = 'DEVICE-LOCAL';
  private storageInfo: StorageInfo = {
    storageType: 'memory',
    dbFileName: 'library.db',
    libraryId: 'UNBOUND',
    deviceId: 'DEVICE-LOCAL',
    sqliteVersion: '3.53.4',
    opfsAvailable: false,
    schemaVersion: 1,
  };

  private constructor() {
    this.initWorker();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Spawns the dedicated Web Worker hosting @sqlite.org/sqlite-wasm
   */
  private initWorker() {
    if (typeof window === 'undefined') return;

    try {
      this.worker = new Worker(new URL('./sqlite.worker.ts', import.meta.url), {
        type: 'module',
      });

      this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { id, success, data, error } = event.data;
        const pending = this.pendingRequests.get(id);
        if (pending) {
          this.pendingRequests.delete(id);
          if (success) {
            pending.resolve(data);
          } else {
            pending.reject(new Error(error || 'Worker operation failed'));
          }
        }
      };

      this.worker.onerror = (err) => {
        console.error('[DatabaseService] Worker error occurred:', err);
      };
    } catch (err) {
      console.error('[DatabaseService] Failed to initialize SQLite Worker:', err);
    }
  }

  /**
   * Sends a request to the worker and awaits its response
   */
  private postRequest<T>(action: WorkerRequest['action'], payload?: WorkerRequest['payload']): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (!this.worker) {
        this.initWorker();
      }
      if (!this.worker) {
        reject(new Error('SQLite worker is unavailable'));
        return;
      }

      const id = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      this.pendingRequests.set(id, { resolve, reject });

      const req: WorkerRequest = { id, action, payload };
      this.worker.postMessage(req);
    });
  }

  /**
   * Bind installation to authorized library and initialize local SQLite database
   */
  public async initDatabase(libraryId: string = 'UNBOUND', deviceId?: string): Promise<StorageInfo> {
    this.currentLibraryId = libraryId;
    if (deviceId) {
      this.currentDeviceId = deviceId;
    } else if (!this.currentDeviceId || this.currentDeviceId === 'DEVICE-LOCAL') {
      this.currentDeviceId = `DEV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }

    const info = await this.postRequest<StorageInfo>('INIT_DATABASE', {
      libraryId: this.currentLibraryId,
      deviceId: this.currentDeviceId,
    });

    this.storageInfo = info;
    this.isInitialized = true;
    return info;
  }

  public getStorageInfo(): StorageInfo {
    return this.storageInfo;
  }

  public getLibraryId(): string {
    return this.currentLibraryId;
  }

  public getDeviceId(): string {
    return this.currentDeviceId;
  }

  /**
   * Run SELECT query returning plain row objects
   */
  public async queryRows<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return this.postRequest<T[]>('QUERY_ROWS', { sql, params });
  }

  /**
   * Run INSERT/UPDATE/DELETE statement returning changes count
   */
  public async execute(sql: string, params: any[] = []): Promise<{ changes: number }> {
    return this.postRequest<{ changes: number }>('EXECUTE_SQL', { sql, params });
  }

  /**
   * Run multiple statements inside ONE atomic SQLite transaction
   */
  public async transaction(statements: SqlStatement[]): Promise<{ success: boolean; changes: number }> {
    return this.postRequest<{ success: boolean; changes: number }>('TRANSACTION', { statements });
  }

  /**
   * ATOMIC TRANSACTION: Commits data change statement AND sync_outbox record in ONE SQLite transaction!
   * Guarantees local changes cannot exist without their corresponding outbox sync record.
   */
  public async executeWithOutbox(
    dataStatement: SqlStatement,
    outbox: {
      entity: string;
      entityId: string;
      operation: 'INSERT' | 'UPDATE' | 'DELETE';
      payload: any;
      idempotencyKey?: string;
    }
  ): Promise<{ success: boolean }> {
    const outboxId = `outbox-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const idempotencyKey = outbox.idempotencyKey || `${this.currentLibraryId}:${outbox.entity}:${outbox.entityId}:${Date.now()}`;
    const payloadStr = typeof outbox.payload === 'string' ? outbox.payload : JSON.stringify(outbox.payload);
    const createdAt = new Date().toISOString();

    const outboxStatement: SqlStatement = {
      sql: `INSERT INTO sync_outbox (
        id, library_id, device_id, entity, entity_id, operation, payload, created_at, attempts, status, last_error, idempotency_key
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'PENDING', NULL, ?)`,
      params: [
        outboxId,
        this.currentLibraryId,
        this.currentDeviceId,
        outbox.entity,
        outbox.entityId,
        outbox.operation,
        payloadStr,
        createdAt,
        idempotencyKey,
      ],
    };

    const res = await this.transaction([dataStatement, outboxStatement]);
    return { success: res.success };
  }

  /**
   * Executes multiple data statements + single outbox record in ONE atomic transaction
   */
  public async executeMultipleWithOutbox(
    dataStatements: SqlStatement[],
    outbox: {
      entity: string;
      entityId: string;
      operation: 'INSERT' | 'UPDATE' | 'DELETE';
      payload: any;
      idempotencyKey?: string;
    }
  ): Promise<{ success: boolean }> {
    const outboxId = `outbox-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const idempotencyKey = outbox.idempotencyKey || `${this.currentLibraryId}:${outbox.entity}:${outbox.entityId}:${Date.now()}`;
    const payloadStr = typeof outbox.payload === 'string' ? outbox.payload : JSON.stringify(outbox.payload);
    const createdAt = new Date().toISOString();

    const outboxStatement: SqlStatement = {
      sql: `INSERT INTO sync_outbox (
        id, library_id, device_id, entity, entity_id, operation, payload, created_at, attempts, status, last_error, idempotency_key
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'PENDING', NULL, ?)`,
      params: [
        outboxId,
        this.currentLibraryId,
        this.currentDeviceId,
        outbox.entity,
        outbox.entityId,
        outbox.operation,
        payloadStr,
        createdAt,
        idempotencyKey,
      ],
    };

    const res = await this.transaction([...dataStatements, outboxStatement]);
    return { success: res.success };
  }

  /**
   * Fetch all table counts
   */
  public async getTableCounts(): Promise<TableCountInfo[]> {
    return this.postRequest<TableCountInfo[]>('GET_TABLE_COUNTS');
  }

  /**
   * Run PRAGMA integrity_check
   */
  public async pragmaIntegrityCheck(): Promise<string> {
    return this.postRequest<string>('PRAGMA_CHECK');
  }

  /**
   * Fetch pending sync outbox records
   */
  public async getPendingOutbox(): Promise<SyncOutboxRow[]> {
    return this.queryRows<SyncOutboxRow>(
      `SELECT * FROM sync_outbox WHERE status = 'PENDING' ORDER BY created_at ASC`
    );
  }

  /**
   * Mark outbox item as SYNCED (only after server acknowledgement)
   */
  public async markOutboxSynced(id: string): Promise<void> {
    await this.execute(
      `UPDATE sync_outbox SET status = 'SYNCED', last_error = NULL WHERE id = ?`,
      [id]
    );
  }

  /**
   * Mark outbox item as FAILED with error
   */
  public async markOutboxFailed(id: string, errorMsg: string): Promise<void> {
    await this.execute(
      `UPDATE sync_outbox SET status = 'FAILED', attempts = attempts + 1, last_error = ? WHERE id = ?`,
      [errorMsg, id]
    );
  }

  /**
   * Export raw SQLite database binary file (.db)
   */
  public async exportDatabaseFile(): Promise<{ fileName: string; blob: Blob; byteLength: number }> {
    const res = await this.postRequest<{ dbFileName: string; byteArray: number[]; byteLength: number }>('EXPORT_DATABASE');
    const u8 = new Uint8Array(res.byteArray || []);
    const blob = new Blob([u8], { type: 'application/x-sqlite3' });
    return {
      fileName: res.dbFileName || 'library.db',
      blob,
      byteLength: res.byteLength || u8.byteLength,
    };
  }
}

export const dbService = DatabaseService.getInstance();
