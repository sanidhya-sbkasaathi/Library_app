/**
 * Direct Client-Side Supabase Management API Engine
 * Runs 100% in frontend & standalone desktop runtime without needing any local proxy server.
 * Handles PAT token validation, project discovery, schema migrations, and key retrieval.
 */

import { MIGRATION_MANIFEST, MigrationInfo } from './supabaseMigrations';

export interface SupabaseProject {
  id: string;
  name: string;
  organization_id: string;
  region: string;
  status: string;
  created_at?: string;
}

export interface MigrationStepResult {
  version: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'skipped' | 'failed';
  durationMs?: number;
  error?: string;
}

export interface MigrationRunSummary {
  success: boolean;
  projectRef: string;
  projectUrl: string;
  anonKey?: string;
  version: string;
  totalMigrations: number;
  appliedMigrations: number;
  skippedMigrations: number;
  failedMigrations: number;
  tableCount: number;
  tables: string[];
  steps: MigrationStepResult[];
  error?: string;
}

export class SupabaseManagementApi {
  /**
   * Check if client has active internet connectivity
   */
  public static isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  /**
   * Get the embedded migration manifest (instant in-memory)
   */
  public static getManifest(): MigrationInfo[] {
    return MIGRATION_MANIFEST;
  }

  /**
   * Returns base URL for Management API: in local dev, routes via dev proxy to eliminate CORS errors
   */
  public static getBaseApiUrl(): string {
    if (typeof window !== 'undefined') {
      if (window.location.protocol === 'app:') {
        return 'app://app/api/supabase-mgmt-proxy';
      }
      const isElectron = /Electron/i.test(navigator.userAgent) || window.location.protocol === 'file:';
      const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (isLocalHost || isElectron) {
        const origin = window.location.origin && window.location.origin !== 'null' ? window.location.origin : 'http://localhost:5173';
        return `${origin}/api/supabase-mgmt-proxy`;
      }
    }
    return 'https://api.supabase.com';
  }

  /**
   * Validates a Personal Access Token (sbp_...) and fetches owner's Supabase projects
   */
  public static async validateTokenAndListProjects(patToken: string): Promise<{
    ok: boolean;
    projects?: SupabaseProject[];
    error?: string;
  }> {
    const cleanToken = patToken.trim();
    if (!cleanToken) {
      return { ok: false, error: 'Personal Access Token is required (e.g. sbp_...)' };
    }

    if (!this.isOnline()) {
      return {
        ok: false,
        error: '⚡ Device is offline. Internet connection is required to communicate with Supabase Cloud.',
      };
    }

    try {
      const res = await fetch(`${this.getBaseApiUrl()}/v1/projects`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          return {
            ok: false,
            error: 'Invalid Personal Access Token. Please verify token permissions from supabase.com/dashboard/account/tokens.',
          };
        }
        const errText = await res.text();
        return {
          ok: false,
          error: `Supabase API returned HTTP ${res.status}: ${errText.substring(0, 150)}`,
        };
      }

      const projects = (await res.json()) as SupabaseProject[];
      return { ok: true, projects: Array.isArray(projects) ? projects : [] };
    } catch (err: any) {
      return {
        ok: false,
        error: err.message || 'Network failure connecting to Supabase Management API. Check your internet connection.',
      };
    }
  }

  /**
   * Fetch public API keys (anon key) for a project
   */
  public static async getProjectApiKeys(
    patToken: string,
    projectRef: string
  ): Promise<{
    ok: boolean;
    anonKey?: string;
    projectUrl?: string;
    error?: string;
  }> {
    const cleanToken = patToken.trim();
    const cleanRef = projectRef.trim();

    if (!cleanToken) {
      return { ok: false, error: 'PAT Token is required to fetch project API keys.' };
    }
    if (!cleanRef || cleanRef === 'custom-project') {
      return { ok: false, error: 'Invalid or missing project reference ID.' };
    }

    try {
      const res = await fetch(`${this.getBaseApiUrl()}/v1/projects/${cleanRef}/api-keys`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        return {
          ok: false,
          error: `Failed to fetch project API keys (${res.status}): ${res.statusText}`,
        };
      }

      const keys = (await res.json()) as Array<{ name: string; api_key: string }>;
      const anon = Array.isArray(keys)
        ? (keys.find(k => k.name === 'anon' || k.name?.toLowerCase().includes('anon') || k.name?.toLowerCase().includes('pub')) || keys[0])
        : null;
      return {
        ok: true,
        anonKey: anon?.api_key,
        projectUrl: `https://${cleanRef}.supabase.co`,
      };
    } catch (err: any) {
      return { ok: false, error: err.message || 'Failed to fetch project API keys.' };
    }
  }

  /**
   * Execute raw SQL query against Supabase project using Management API
   */
  public static async executeSqlQuery(
    patToken: string,
    projectRef: string,
    sql: string
  ): Promise<any> {
    const url = `${this.getBaseApiUrl()}/v1/projects/${projectRef}/database/query`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${patToken.trim()}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!res.ok) {
      const errText = await res.text();
      let errorMsg = errText;
      try {
        const json = JSON.parse(errText);
        errorMsg = json.message || json.error || errText;
      } catch {
        // use raw text
      }
      throw new Error(`Query failed (${res.status}): ${errorMsg}`);
    }

    return await res.json();
  }

  /**
   * Check status of database: migrations applied and tables present
   */
  public static async getDatabaseStatus(
    patToken: string,
    projectRef: string
  ): Promise<{
    hasMigrationsTable: boolean;
    appliedVersions: string[];
    tables: string[];
    tableCount: number;
    rlsEnabledCount: number;
  }> {
    let hasMigrationsTable = false;
    let appliedVersions: string[] = [];

    // 1. Check if public.schema_migrations exists
    try {
      const checkTableSql = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'schema_migrations'
        ) as exists;
      `;
      const tableCheckResult = await this.executeSqlQuery(patToken, projectRef, checkTableSql);
      hasMigrationsTable = Boolean(tableCheckResult?.[0]?.exists);

      if (hasMigrationsTable) {
        const migrationsSql = `
          SELECT version FROM public.schema_migrations ORDER BY version ASC;
        `;
        const migResult = await this.executeSqlQuery(patToken, projectRef, migrationsSql);
        if (Array.isArray(migResult)) {
          appliedVersions = migResult.map(r => String(r.version));
        }
      }
    } catch {
      hasMigrationsTable = false;
    }

    // 2. Query list of public tables
    let tables: string[] = [];
    try {
      const tablesSql = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name ASC;
      `;
      const tablesRes = await this.executeSqlQuery(patToken, projectRef, tablesSql);
      if (Array.isArray(tablesRes)) {
        tables = tablesRes.map(r => r.table_name);
      }
    } catch {
      tables = [];
    }

    // 3. Query RLS status on tables
    let rlsEnabledCount = 0;
    try {
      const rlsSql = `
        SELECT count(*) as count 
        FROM pg_tables 
        WHERE schemaname = 'public' AND rowsecurity = true;
      `;
      const rlsRes = await this.executeSqlQuery(patToken, projectRef, rlsSql);
      if (Array.isArray(rlsRes) && rlsRes[0]?.count) {
        rlsEnabledCount = Number(rlsRes[0].count);
      }
    } catch {
      rlsEnabledCount = 0;
    }

    return {
      hasMigrationsTable,
      appliedVersions,
      tables,
      tableCount: tables.length,
      rlsEnabledCount,
    };
  }

  /**
   * Run the deterministic 14-migration suite with progress reporting
   */
  public static async runMigrations(
    patToken: string,
    projectRef: string,
    onProgress?: (step: MigrationStepResult, total: number, current: number) => void
  ): Promise<MigrationRunSummary> {
    const projectUrl = `https://${projectRef}.supabase.co`;
    const steps: MigrationStepResult[] = [];
    let appliedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    // Step 0: Ensure schema_migrations table exists
    try {
      const initTrackingSql = `
        CREATE TABLE IF NOT EXISTS public.schema_migrations (
          version TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `;
      await this.executeSqlQuery(patToken, projectRef, initTrackingSql);
    } catch (err: any) {
      return {
        success: false,
        projectRef,
        projectUrl,
        version: 'v1.0.0',
        totalMigrations: MIGRATION_MANIFEST.length,
        appliedMigrations: 0,
        skippedMigrations: 0,
        failedMigrations: 1,
        tableCount: 0,
        tables: [],
        steps: [],
        error: `Failed to initialize schema_migrations tracking table: ${err.message}`,
      };
    }

    // Check which migrations are already applied
    const status = await this.getDatabaseStatus(patToken, projectRef);
    const alreadyApplied = new Set(status.appliedVersions);

    // Sequentially execute each migration in manifest
    for (let i = 0; i < MIGRATION_MANIFEST.length; i++) {
      const mig = MIGRATION_MANIFEST[i];
      const step: MigrationStepResult = {
        version: mig.version,
        name: mig.name,
        status: 'pending',
      };

      if (alreadyApplied.has(mig.version)) {
        step.status = 'skipped';
        steps.push(step);
        skippedCount++;
        if (onProgress) onProgress(step, MIGRATION_MANIFEST.length, i + 1);
        continue;
      }

      const startMs = Date.now();
      step.status = 'running';
      if (onProgress) onProgress(step, MIGRATION_MANIFEST.length, i + 1);

      try {
        await this.executeSqlQuery(patToken, projectRef, mig.sql);

        // Record successful migration in schema_migrations
        const recordSql = `
          INSERT INTO public.schema_migrations (version, name) 
          VALUES ('${mig.version}', '${mig.filename}')
          ON CONFLICT (version) DO NOTHING;
        `;
        await this.executeSqlQuery(patToken, projectRef, recordSql);

        step.status = 'completed';
        step.durationMs = Date.now() - startMs;
        appliedCount++;
        steps.push(step);
        if (onProgress) onProgress(step, MIGRATION_MANIFEST.length, i + 1);
      } catch (err: any) {
        step.status = 'failed';
        step.durationMs = Date.now() - startMs;
        step.error = err.message || 'SQL execution failed';
        failedCount++;
        steps.push(step);
        if (onProgress) onProgress(step, MIGRATION_MANIFEST.length, i + 1);

        return {
          success: false,
          projectRef,
          projectUrl,
          version: 'v1.0.0',
          totalMigrations: MIGRATION_MANIFEST.length,
          appliedMigrations: appliedCount,
          skippedMigrations: skippedCount,
          failedMigrations: failedCount,
          tableCount: status.tableCount,
          tables: status.tables,
          steps,
          error: `Migration ${mig.filename} failed: ${err.message}`,
        };
      }
    }

    // Post-migration validation: verify all tables
    const finalStatus = await this.getDatabaseStatus(patToken, projectRef);

    // Fetch anon public API key
    let anonKey: string | undefined;
    const keyResult = await this.getProjectApiKeys(patToken, projectRef);
    if (keyResult.ok) {
      anonKey = keyResult.anonKey;
    }

    return {
      success: true,
      projectRef,
      projectUrl,
      anonKey,
      version: 'v1.0.0',
      totalMigrations: MIGRATION_MANIFEST.length,
      appliedMigrations: appliedCount,
      skippedMigrations: skippedCount,
      failedMigrations: failedCount,
      tableCount: finalStatus.tableCount,
      tables: finalStatus.tables,
      steps,
    };
  }
}
