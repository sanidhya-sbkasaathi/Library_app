import fs from 'fs';
import path from 'path';

export interface MigrationInfo {
  version: string;
  filename: string;
  name: string;
  description: string;
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
  version: string; // e.g. "v1.0.0"
  totalMigrations: number;
  appliedMigrations: number;
  skippedMigrations: number;
  failedMigrations: number;
  tableCount: number;
  tables: string[];
  steps: MigrationStepResult[];
  error?: string;
}

export const MIGRATION_MANIFEST: MigrationInfo[] = [
  { version: '001', filename: '001_extensions.sql', name: 'PostgreSQL Extensions', description: 'Enable uuid-ossp, pgcrypto, citext extensions' },
  { version: '002', filename: '002_libraries.sql', name: 'Libraries & Organizations', description: 'Core multi-tenant organization entity tables' },
  { version: '003', filename: '003_users.sql', name: 'Users & Authentication', description: 'Library user accounts and credential metadata' },
  { version: '004', filename: '004_roles.sql', name: 'RBAC Roles Matrix', description: 'Role-based access control definitions' },
  { version: '005', filename: '005_permissions.sql', name: 'System Permissions', description: 'Granular permissions and role-permission mappings' },
  { version: '006', filename: '006_books.sql', name: 'Catalog & Books', description: 'Book titles, authors, categories, ISBNs' },
  { version: '007', filename: '007_book_copies.sql', name: 'Book Physical Copies', description: 'Inventory copies, barcodes, rack locations' },
  { version: '008', filename: '008_issues.sql', name: 'Circulation Issues', description: 'Book check-out tracking, due dates, student links' },
  { version: '009', filename: '009_returns.sql', name: 'Circulation Returns', description: 'Book check-in logs, return condition, late checks' },
  { version: '010', filename: '010_fines.sql', name: 'Fines & Payments', description: 'Overdue penalties, fee calculation, payment logs' },
  { version: '011', filename: '011_audit_logs.sql', name: 'Audit & Compliance', description: 'Tamper-evident system activity and event logging' },
  { version: '012', filename: '012_functions.sql', name: 'Stored Procedures', description: 'Automated overdue calculation & copy availability triggers' },
  { version: '013', filename: '013_triggers.sql', name: 'Database Triggers', description: 'Automatic updated_at timestamps & stock counters' },
  { version: '014', filename: '014_rls.sql', name: 'Row-Level Security (RLS)', description: 'Safe client-level publishable key read/write policies' },
];

export class SupabaseMigrationRunner {
  private migrationsDir: string;

  constructor() {
    // Primary path: relative to process.cwd() or project root
    this.migrationsDir = path.resolve(process.cwd(), 'supabase', 'migrations');
    if (!fs.existsSync(this.migrationsDir)) {
      // Fallback for subdirectories
      const alt = path.resolve(process.cwd(), 'Library_app', 'supabase', 'migrations');
      if (fs.existsSync(alt)) {
        this.migrationsDir = alt;
      }
    }
  }

  /**
   * Execute raw SQL query against Supabase project using Management API
   */
  public async executeSqlQuery(token: string, projectRef: string, sql: string): Promise<any> {
    const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
    
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
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
      throw new Error(`Query execution failed (${res.status}): ${errorMsg}`);
    }

    return await res.json();
  }

  /**
   * Check status of database: migrations applied and tables present
   */
  public async getDatabaseStatus(token: string, projectRef: string): Promise<{
    hasMigrationsTable: boolean;
    appliedVersions: string[];
    tables: string[];
    tableCount: number;
    rlsEnabledCount: number;
  }> {
    // 1. Check if public.schema_migrations exists and get applied versions
    let hasMigrationsTable = false;
    let appliedVersions: string[] = [];

    try {
      const checkTableSql = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'schema_migrations'
        ) as exists;
      `;
      const tableCheckResult = await this.executeSqlQuery(token, projectRef, checkTableSql);
      hasMigrationsTable = Boolean(tableCheckResult?.[0]?.exists);

      if (hasMigrationsTable) {
        const migrationsSql = `
          SELECT version FROM public.schema_migrations ORDER BY version ASC;
        `;
        const migResult = await this.executeSqlQuery(token, projectRef, migrationsSql);
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
      const tablesRes = await this.executeSqlQuery(token, projectRef, tablesSql);
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
      const rlsRes = await this.executeSqlQuery(token, projectRef, rlsSql);
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
  public async runMigrations(
    token: string,
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
      await this.executeSqlQuery(token, projectRef, initTrackingSql);
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
    const status = await this.getDatabaseStatus(token, projectRef);
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

      // Read SQL file
      const filePath = path.join(this.migrationsDir, mig.filename);
      let sqlContent = '';
      try {
        sqlContent = await fs.promises.readFile(filePath, 'utf-8');
      } catch (err: any) {
        step.status = 'failed';
        step.error = `Could not read migration file ${mig.filename}: ${err.message}`;
        steps.push(step);
        failedCount++;
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
          error: step.error,
        };
      }

      // Execute SQL
      const startMs = Date.now();
      step.status = 'running';
      if (onProgress) onProgress(step, MIGRATION_MANIFEST.length, i + 1);

      try {
        await this.executeSqlQuery(token, projectRef, sqlContent);

        // Record successful migration in schema_migrations
        const recordSql = `
          INSERT INTO public.schema_migrations (version, name) 
          VALUES ('${mig.version}', '${mig.filename}')
          ON CONFLICT (version) DO NOTHING;
        `;
        await this.executeSqlQuery(token, projectRef, recordSql);

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
    const finalStatus = await this.getDatabaseStatus(token, projectRef);

    // Fetch anon public API key
    let anonKey: string | undefined;
    try {
      const keysRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      if (keysRes.ok) {
        const keys = (await keysRes.json()) as Array<{ name: string; api_key: string }>;
        const found = keys.find(k => k.name === 'anon');
        anonKey = found?.api_key;
      }
    } catch {
      // anon key fetching error handled gracefully
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

export const migrationRunner = new SupabaseMigrationRunner();
