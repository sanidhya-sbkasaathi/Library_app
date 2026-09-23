/**
 * SQLite Worker Message Types and Interfaces
 * Dedicated contract between Main UI thread and SQLite Worker
 */

export type WorkerActionType =
  | 'INIT_DATABASE'
  | 'EXECUTE_SQL'
  | 'QUERY_ROWS'
  | 'TRANSACTION'
  | 'GET_TABLE_COUNTS'
  | 'PRAGMA_CHECK'
  | 'GET_STORAGE_INFO'
  | 'EXPORT_DATABASE'
  | 'CLOSE_DATABASE';

export interface SqlStatement {
  sql: string;
  params?: any[];
}

export interface WorkerRequest {
  id: string;
  action: WorkerActionType;
  payload?: {
    libraryId?: string;
    deviceId?: string;
    forceMemory?: boolean;
    sql?: string;
    params?: any[];
    statements?: SqlStatement[];
  };
}

export interface TableCountInfo {
  name: string;
  count: number;
}

export interface StorageInfo {
  storageType: 'opfs' | 'memory' | 'kvvfs';
  dbFileName: string;
  libraryId: string;
  deviceId: string;
  sqliteVersion: string;
  opfsAvailable: boolean;
  schemaVersion: number;
}

export interface WorkerResponse<T = any> {
  id: string;
  success: boolean;
  data?: T;
  error?: string;
}

export interface SyncOutboxRow {
  id: string;
  library_id: string;
  device_id: string;
  entity: string;
  entity_id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: string;
  created_at: string;
  attempts: number;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED' | 'CONFLICT';
  last_error: string | null;
  idempotency_key: string;
}

export interface SyncMetadataRow {
  library_id: string;
  device_id: string;
  last_push_cursor: string | null;
  last_pull_cursor: string | null;
  last_successful_sync: string | null;
  schema_version: number;
}
