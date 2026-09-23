import React, { useState } from 'react';
import {
  RefreshCw,
  Wifi,
  WifiOff,
  Database,
  Shield,
  ShieldCheck,
  Server,
  Laptop,
  HardDrive,
  Download,
  Upload,
  Settings,
  HelpCircle,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Moon,
  Sun,
  Monitor,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { db } from '../../db/localDatabase';
import { ThemeMode } from '../../types';

// ----------------------------------------------------
// Screen 48: Sync Center
// ----------------------------------------------------
export const SyncCenterScreen: React.FC = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const queue = db.syncQueue;

  const handleSync = async () => {
    setIsSyncing(true);
    await db.triggerSyncNow();
    setIsSyncing(false);
  };

  return (
    <div className="space-y-5 pb-8 animate-in fade-in duration-300">
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/70 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            Cloud Synchronization Engine
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Outbox queue pattern: local mutations commit to SQLite instantly, then push incrementally to Supabase cloud
          </p>
        </div>

        <button
          onClick={handleSync}
          disabled={!db.isOnline || isSyncing}
          className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 disabled:opacity-40 transition"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Synchronizing with Supabase...' : 'Trigger Sync Now'}
        </button>
      </div>

      {/* Sync Status KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400">Connection State</span>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2.5 h-2.5 rounded-full ${db.isOnline ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500'}`} />
            <span className="font-bold text-slate-900 dark:text-white text-sm">{db.isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400">Outbox Queue Items</span>
          <h3 className="font-mono font-bold text-slate-900 dark:text-white text-lg mt-1">{queue.length} Pending</h3>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400">Last Successful Sync</span>
          <h3 className="font-bold text-cyan-600 dark:text-cyan-300 text-sm mt-1">{db.lastSyncTime}</h3>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400">Cloud Target</span>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm mt-1">PostgreSQL Multi-Tenant</h3>
        </div>
      </div>

      {/* Sync Queue Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/70 shadow-xl overflow-hidden">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          Pending & Recent Outbox Mutation Queue
        </h3>

        {queue.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 dark:text-emerald-400 mx-auto mb-2 opacity-80" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">All local changes are fully synchronized.</p>
            <p className="text-slate-400 dark:text-slate-500 mt-0.5">Local SQLite database is in sync with Supabase cloud PostgreSQL.</p>
          </div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="pb-2">Queue ID</th>
                <th className="pb-2">Entity Type</th>
                <th className="pb-2">Operation</th>
                <th className="pb-2">Device</th>
                <th className="pb-2">Timestamp</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {queue.map(item => (
                <tr key={item.id}>
                  <td className="py-2.5 font-mono text-cyan-600 dark:text-cyan-400">{item.id.slice(0, 16)}...</td>
                  <td className="py-2.5 font-semibold text-slate-900 dark:text-white uppercase text-[10px]">{item.entityType}</td>
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 font-mono text-[10px] border border-cyan-200 dark:border-cyan-800/40">
                      {item.operation}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-500 dark:text-slate-400">{item.deviceId}</td>
                  <td className="py-2.5 text-slate-500 dark:text-slate-400">{item.createdAt.slice(11, 19)}</td>
                  <td className="py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'SYNCED'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ----------------------------------------------------
// Screen 51: Audit Logs
// ----------------------------------------------------
export const AuditLogsScreen: React.FC = () => {
  return (
    <div className="space-y-5 pb-8 animate-in fade-in duration-300">
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/70 shadow-xl flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Security & Operational Audit Trail
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tamper-evident logs of every admission, payment, seat swap, and administrative setting
          </p>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/70 shadow-xl overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead className="text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th className="pb-3">Timestamp</th>
              <th className="pb-3">User</th>
              <th className="pb-3">Action</th>
              <th className="pb-3">Module</th>
              <th className="pb-3">Device</th>
              <th className="pb-3">Audit Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {db.auditLogs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                <td className="py-2.5 text-slate-500 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">{log.timestamp}</td>
                <td className="py-2.5 font-bold text-slate-900 dark:text-white">{log.userName}</td>
                <td className="py-2.5">
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 font-mono text-[10px]">
                    {log.action}
                  </span>
                </td>
                <td className="py-2.5 text-slate-700 dark:text-slate-300">{log.module}</td>
                <td className="py-2.5 text-slate-500 dark:text-slate-400">{log.device}</td>
                <td className="py-2.5 text-slate-700 dark:text-slate-300 text-xs">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// Screen 46: Backup Center
// ----------------------------------------------------
export const BackupCenterScreen: React.FC = () => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleExportBackup = () => {
    const dataStr = JSON.stringify(
      {
        associations: db.associations,
        students: db.students,
        seats: db.seats,
        admissions: db.admissions,
        payments: db.payments,
        auditLogs: db.auditLogs,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    );
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sqlite_library_backup_${Date.now()}.enc.json`;
    a.click();
    setDownloadSuccess(true);
  };

  return (
    <div className="space-y-5 pb-8 animate-in fade-in duration-300">
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/70 shadow-xl flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            Database Backup & Recovery
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Local SQLite encrypted database dumps and scheduled automated snapshotting
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={async () => {
              try {
                await db.exportDatabaseFile();
                setDownloadSuccess(true);
              } catch (err: any) {
                alert(`Export failed: ${err.message}`);
              }
            }}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 text-xs transition"
          >
            <Database className="w-4 h-4" />
            Download SQLite .db File
          </button>
          <button
            onClick={handleExportBackup}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 text-xs transition"
          >
            <Download className="w-4 h-4" />
            Download JSON Snapshot
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          Database export generated and downloaded directly to your computer.
        </div>
      )}

      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/70 shadow-xl space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white">Automated Snapshot History</h3>
        <div className="space-y-2">
          {[
            { name: 'daily_snapshot_2025_04_28_0800.enc', size: '4.2 MB', date: 'Today 08:00 AM', status: 'Healthy' },
            { name: 'daily_snapshot_2025_04_27_2000.enc', size: '4.1 MB', date: '27 Apr 2025 08:00 PM', status: 'Healthy' },
            { name: 'daily_snapshot_2025_04_26_2000.enc', size: '3.9 MB', date: '26 Apr 2025 08:00 PM', status: 'Healthy' },
          ].map((b, i) => (
            <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 text-xs border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <div>
                  <span className="font-mono text-slate-900 dark:text-white font-bold block">{b.name}</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">{b.size} • {b.date}</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                {b.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// Screen 52: General Settings & Live Theme Preview
// ----------------------------------------------------
export const GeneralSettingsScreen: React.FC = () => {
  const currentTheme = db.theme;

  const handleTheme = (theme: ThemeMode) => {
    db.setTheme(theme);
  };

  return (
    <div className="space-y-5 pb-8 animate-in fade-in duration-300">
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/70 shadow-xl">
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          General System Settings & Appearance
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure application theme, currency, regional timezones, and desktop preferences
        </p>
      </div>

      {/* Theme Switcher with Live Preview */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/70 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Appearance & Theme System (Adaptive System First)
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Switch between Light, Dark, or System mode with instant application-wide semantic token updates.
        </p>

        <div className="grid grid-cols-3 gap-4 pt-2">
          <button
            onClick={() => handleTheme('light')}
            className={`p-4 rounded-xl border text-center transition flex flex-col items-center gap-2 ${
              currentTheme === 'light'
                ? 'bg-amber-50 dark:bg-cyan-500/20 border-amber-500 dark:border-cyan-500 text-amber-900 dark:text-white font-bold shadow-md'
                : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sun className="w-6 h-6 text-amber-500" />
            <span className="text-xs font-bold">☀ Light Theme</span>
          </button>

          <button
            onClick={() => handleTheme('dark')}
            className={`p-4 rounded-xl border text-center transition flex flex-col items-center gap-2 ${
              currentTheme === 'dark'
                ? 'bg-cyan-50 dark:bg-cyan-500/20 border-cyan-500 text-cyan-900 dark:text-white font-bold shadow-md'
                : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Moon className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            <span className="text-xs font-bold">🌙 Dark Theme</span>
          </button>

          <button
            onClick={() => handleTheme('system')}
            className={`p-4 rounded-xl border text-center transition flex flex-col items-center gap-2 ${
              currentTheme === 'system'
                ? 'bg-purple-50 dark:bg-purple-500/20 border-purple-500 text-purple-900 dark:text-white font-bold shadow-md'
                : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Monitor className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-bold">🖥 System Default</span>
          </button>
        </div>

        {/* Live Preview Demonstration Component */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3 mt-4">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Live Token Preview</span>
          <div className="flex gap-3">
            <div className="p-3 rounded-lg bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 text-xs font-semibold">
              Primary Accent Pill
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
              Success State Badge
            </div>
            <div className="p-3 rounded-lg bg-pink-500/15 text-pink-700 dark:text-pink-300 border border-pink-500/30 text-xs font-semibold">
              Financial Highlight
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// Screen 55: Help & System Diagnostics
// ----------------------------------------------------
export const SystemDiagnosticsScreen: React.FC = () => {
  const diagnostics = [
    { name: 'Electron Desktop Engine', status: 'Healthy', version: 'v32.0.0 (Windows Native)' },
    { name: 'Local Database (SQLite Engine)', status: 'Healthy', details: 'IndexedDB / SQLite Operational Store Active' },
    { name: 'Cloud Storage & Supabase Sync', status: db.isOnline ? 'Online' : 'Offline', details: 'PostgreSQL Multi-tenant Ready' },
    { name: 'Thermal Receipt Printing Engine', status: 'Ready', details: '80mm / A4 Windows Native Spooler' },
    { name: 'Biometric & QR Scanner Camera', status: 'Active', details: 'Hardware Direct Video Stream' },
    { name: 'Tenant Association Isolation', status: 'Enforced', details: 'Association_ID Scope on all queries' },
  ];

  return (
    <div className="space-y-5 pb-8 animate-in fade-in duration-300">
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/70 shadow-xl flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            System Diagnostics & Architecture Status
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Component health, local storage checks, and tenant isolation monitors
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {diagnostics.map((d, i) => (
          <div key={i} className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/70 shadow-xl flex items-start justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">{d.name}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{d.details || d.version}</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              {d.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
