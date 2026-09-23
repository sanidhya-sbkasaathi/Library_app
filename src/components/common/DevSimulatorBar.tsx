import React, { useState } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Sparkles,
  Database,
  ShieldCheck,
  Building,
  Layers,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { db } from '../../db/localDatabase';
import { Role, ThemeMode } from '../../types';
import { ROLE_PERMISSIONS } from '../../utils/rolePermissions';

interface DevSimulatorBarProps {
  currentScreen: string;
  onNavigate: (screenId: string) => void;
}

export const DevSimulatorBar: React.FC<DevSimulatorBarProps> = ({
  currentScreen,
  onNavigate,
}) => {
  // Initially OFF / collapsed by default
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('lib_mgmt_dev_collapsed') !== 'false';
  });
  const [selectedRole, setSelectedRole] = useState<Role>(
    (db.currentUser?.role as Role) || 'Owner'
  );

  const handleToggleInternet = () => {
    db.toggleOnline();
  };

  const handleSyncNow = async () => {
    await db.triggerSyncNow();
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const role = e.target.value as Role;
    setSelectedRole(role);
    db.currentUser.role = role;
    db.currentUser.permissions = ROLE_PERMISSIONS[role] || [];
    db.boundRole = role;
    db.saveToStorage();
    db.notify();
  };

  const handleAssociationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    db.setAssociation(e.target.value);
  };

  const handleToggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem('lib_mgmt_dev_collapsed', String(next));
    } catch {
      // ignore
    }
  };

  const allScreensList = [
    { id: 'onboarding-landing', label: '00. Onboarding Landing (Owner vs Role)' },
    { id: 'onboarding-owner', label: '00A. Owner Onboarding (Ed25519)' },
    { id: 'onboarding-role', label: '00B. Role Onboarding (Ed25519)' },
    { id: 'dashboard', label: '01. Dashboard (Master Reference)' },
    { id: 'welcome', label: '02. Welcome / Installation' },
    { id: 'org-setup', label: '03. Organization Setup' },
    { id: 'setup-wizard', label: '04. Initial Setup Wizard' },
    { id: 'login', label: '05. Login / Auth' },
    { id: 'device-verification', label: '06. Device Verification' },
    { id: 'password-recovery', label: '07. Password Recovery' },
    { id: 'library-profile', label: '08. Library Profile' },
    { id: 'library-config', label: '09. Library Configuration' },
    { id: 'associations', label: '10. Association Multi-Tenant' },
    { id: 'rooms', label: '11. Room Management' },
    { id: 'seats', label: '12. Visual Seat Matrix' },
    { id: 'students', label: '13. Student Directory' },
    { id: 'student-profile', label: '14. Student Profile (10 Tabs)' },
    { id: 'student-add-edit', label: '15. Add / Edit Student' },
    { id: 'admissions', label: '16. Admissions List' },
    { id: 'new-admission', label: '17. New Admission Wizard' },
    { id: 'memberships', label: '18. Membership Management' },
    { id: 'membership-plans', label: '19. Membership Plans' },
    { id: 'attendance-live', label: '20. Live Attendance QR Scanner' },
    { id: 'attendance-history', label: '21. Attendance History' },
    { id: 'fees-dashboard', label: '22. Fees Dashboard' },
    { id: 'transactions', label: '23. Transactions Ledger' },
    { id: 'collect-payment', label: '24. Collect Payment' },
    { id: 'receipt-details', label: '25. Receipt Details (Thermal & A4)' },
    { id: 'reservations', label: '26. Seat Reservations' },
    { id: 'seat-transfer', label: '27. Seat Transfer Atomic' },
    { id: 'lockers', label: '28. Locker Matrix (L001-L040)' },
    { id: 'leave', label: '29. Leave Management' },
    { id: 'visitors', label: '30. Visitor Register' },
    { id: 'complaints', label: '31. Complaint Management' },
    { id: 'notices', label: '32. Notice Board' },
    { id: 'staff', label: '33. Staff Directory' },
    { id: 'staff-attendance', label: '34. Staff Attendance & Permissions' },
    { id: 'expenses', label: '35. Expense Management' },
    { id: 'income', label: '36. Income & Cash Flow' },
    { id: 'reports-dashboard', label: '37. Reports Dashboard' },
    { id: 'student-reports', label: '38. Student Reports' },
    { id: 'financial-reports', label: '39. Financial Reports' },
    { id: 'operational-reports', label: '40. Operational & Occupancy Reports' },
    { id: 'qr-id-cards', label: '41. QR & Student ID Card Generator' },
    { id: 'print-center', label: '42. Print Center' },
    { id: 'documents', label: '43. Document Center (Cloud Storage)' },
    { id: 'notifications', label: '44. Notification Center' },
    { id: 'notification-rules', label: '45. Notification Rules' },
    { id: 'backup-center', label: '46. Backup Center (Local SQLite)' },
    { id: 'restore-center', label: '47. Restore & Recovery' },
    { id: 'sync-center', label: '48. Sync Center & Outbox' },
    { id: 'devices', label: '49. Device Management' },
    { id: 'security-center', label: '50. Security Center & RBAC' },
    { id: 'audit-logs', label: '51. Tamper-Evident Audit Logs' },
    { id: 'general-settings', label: '52. General Settings' },
    { id: 'operational-settings', label: '53. Operational Settings' },
    { id: 'system-settings', label: '54. System Settings' },
    { id: 'help-system', label: '55. Help & System Information' },
    { id: 'global-search', label: '56. Global Search Command Palette' },
    { id: 'activity-timeline', label: '57. Activity Timeline' },
    { id: 'system-diagnostics', label: '58. System Diagnostics' },
    { id: 'multi-tenant-switcher', label: '59. Multi-Tenant Switcher' },
    { id: 'offline-simulator', label: '60. Offline Simulator Engine' },
    { id: 'local-db-inspector', label: '61. Local DB Inspector (library.db)' },
    { id: 'device-activation', label: '62. Device Activation Workflow (Image 2)' },
  ];

  return (
    <div className="fixed top-12 right-6 z-40 flex flex-col items-end">
      {/* Dev pill button */}
      <button
        onClick={handleToggleCollapse}
        className="px-3 py-1.5 rounded-t-xl bg-white/95 dark:bg-slate-900/95 border border-slate-300 dark:border-slate-700/80 text-cyan-600 dark:text-cyan-400 text-xs font-semibold flex items-center gap-2 shadow-2xl backdrop-blur-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
      >
        <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
        <span>DEV MODE & OFFLINE SIMULATOR</span>
        {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
      </button>

      {/* Expanded Control Box */}
      {!collapsed && (
        <div className="w-[430px] p-3.5 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/90 rounded-b-xl rounded-tl-xl shadow-2xl backdrop-blur-xl space-y-3 text-xs text-slate-800 dark:text-slate-200 animate-in fade-in zoom-in-95">
          {/* Row 1: Internet simulation & Sync */}
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Internet:</span>
              <button
                onClick={handleToggleInternet}
                className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1.5 transition-all ${
                  db.isOnline
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                }`}
              >
                {db.isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                {db.isOnline ? 'ONLINE' : 'OFFLINE'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSyncNow}
                disabled={!db.isOnline || db.isSyncing}
                className="px-2.5 py-1 rounded-md bg-cyan-50 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30 hover:bg-cyan-100 dark:hover:bg-cyan-500/30 font-medium flex items-center gap-1.5 disabled:opacity-40 transition text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${db.isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync Cloud</span>
              </button>
            </div>
          </div>

          {/* Row 2: Tenant Switcher & Role */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-semibold mb-1 flex items-center gap-1">
                <Building className="w-3 h-3 text-cyan-500" />
                Tenant Association
              </label>
              <select
                value={db.currentAssociationId}
                onChange={handleAssociationChange}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              >
                {db.associations.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.code} - {a.name.slice(0, 18)}...
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-semibold mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-purple-500" />
                Active RBAC Role
              </label>
              <select
                value={selectedRole}
                onChange={handleRoleChange}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-purple-500"
              >
                <option value="Super Admin">Super Admin</option>
                <option value="Owner">Owner</option>
                <option value="Manager">Manager</option>
                <option value="Receptionist">Receptionist</option>
                <option value="Accountant">Accountant</option>
              </select>
            </div>
          </div>

          {/* Row 3: Quick Jump to all 60 Screens */}
          <div>
            <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-semibold mb-1 flex items-center gap-1">
              <Layers className="w-3 h-3 text-amber-500" />
              Quick Jump (All 60 Screens)
            </label>
            <select
              value={currentScreen}
              onChange={e => onNavigate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-cyan-400 dark:border-cyan-500/40 rounded-md px-2 py-1.5 text-cyan-800 dark:text-cyan-300 font-medium text-xs focus:outline-none focus:border-cyan-400"
            >
              {allScreensList.map(s => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Developer Database Environment Mode */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
              Developer Environment Mode:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  db.resetToUnbound();
                  onNavigate('onboarding-landing');
                }}
                className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800/80 text-purple-800 dark:text-purple-300 text-[11px] font-bold text-left transition"
              >
                <div className="flex items-center gap-1.5 font-extrabold text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>Fresh Unbound</span>
                </div>
                <span className="text-[10px] opacity-75 font-normal block mt-0.5">
                  0 Students • Onboarding Flow
                </span>
              </button>
              <button
                onClick={() => {
                  db.resetToSeed();
                  onNavigate('dashboard');
                }}
                className="p-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/40 dark:hover:bg-cyan-900/40 border border-cyan-200 dark:border-cyan-800/80 text-cyan-800 dark:text-cyan-300 text-[11px] font-bold text-left transition"
              >
                <div className="flex items-center gap-1.5 font-extrabold text-xs">
                  <Database className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Load Demo Seed</span>
                </div>
                <span className="text-[10px] opacity-75 font-normal block mt-0.5">
                  1,248 Students • Super Admin
                </span>
              </button>
            </div>
          </div>

          {/* Status info bar */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
            <span>
              Queue: <b className="text-cyan-600 dark:text-cyan-400">{db.syncQueue.length} items</b>
            </span>
            <span>
              Seats: <b className="text-emerald-600 dark:text-emerald-400">{db.seats.length}</b> | Students: <b className="text-blue-600 dark:text-blue-400">{db.students.length}</b>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
