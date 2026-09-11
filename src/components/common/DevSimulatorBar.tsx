import React, { useState } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Building,
  Layers,
  ChevronUp,
  ChevronDown,
  Monitor,
  Moon,
  Sun,
} from 'lucide-react';
import { db } from '../../db/localDatabase';
import { Role, ThemeMode } from '../../types';

interface DevSimulatorBarProps {
  currentScreen: string;
  onNavigate: (screenId: string) => void;
}

export const DevSimulatorBar: React.FC<DevSimulatorBarProps> = ({
  currentScreen,
  onNavigate,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>('Super Admin');

  const handleToggleInternet = () => {
    db.toggleOnline();
  };

  const handleSyncNow = async () => {
    await db.triggerSyncNow();
  };

  const handleResetDB = () => {
    if (window.confirm('Reset local SQLite database to initial seeded realistic dataset?')) {
      db.resetToSeed();
    }
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const role = e.target.value as Role;
    setSelectedRole(role);
    db.currentUser.role = role;
    db.saveToStorage();
  };

  const handleAssociationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    db.setAssociation(e.target.value);
  };

  const allScreensList = [
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
        onClick={() => setCollapsed(!collapsed)}
        className="px-3 py-1.5 rounded-t-xl bg-slate-900/95 border border-slate-700/80 text-cyan-400 text-xs font-semibold flex items-center gap-2 shadow-2xl backdrop-blur-md hover:bg-slate-800 transition"
      >
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span>DEV MODE & OFFLINE SIMULATOR</span>
        {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
      </button>

      {/* Expanded Control Box */}
      {!collapsed && (
        <div className="w-[430px] p-3.5 bg-slate-900/95 border border-slate-700/90 rounded-b-xl rounded-tl-xl shadow-2xl backdrop-blur-xl space-y-3 text-xs text-slate-200 animate-in fade-in zoom-in-95">
          {/* Row 1: Internet simulation & Sync */}
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-400">Internet:</span>
              <button
                onClick={handleToggleInternet}
                className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1.5 transition-all ${
                  db.isOnline
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
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
                className="px-2.5 py-1 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 font-medium flex items-center gap-1.5 disabled:opacity-40 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${db.isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync Cloud</span>
              </button>

              <button
                onClick={handleResetDB}
                title="Reset local DB to seed"
                className="p-1 rounded-md text-slate-400 hover:text-rose-300 hover:bg-rose-500/20 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Instant Theme Toggle */}
              <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded-md border border-slate-800">
                <button
                  onClick={() => db.setTheme('light')}
                  title="Light Theme"
                  className={`p-1 rounded ${db.theme === 'light' ? 'bg-amber-500/30 text-amber-300' : 'text-slate-400 hover:text-white'}`}
                >
                  <Sun className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => db.setTheme('dark')}
                  title="Dark Theme"
                  className={`p-1 rounded ${db.theme === 'dark' ? 'bg-cyan-500/30 text-cyan-300' : 'text-slate-400 hover:text-white'}`}
                >
                  <Moon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => db.setTheme('system')}
                  title="System Theme"
                  className={`p-1 rounded ${db.theme === 'system' ? 'bg-purple-500/30 text-purple-300' : 'text-slate-400 hover:text-white'}`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Tenant Switcher & Role */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-1 flex items-center gap-1">
                <Building className="w-3 h-3 text-cyan-400" />
                Tenant Association
              </label>
              <select
                value={db.currentAssociationId}
                onChange={handleAssociationChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              >
                {db.associations.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.code} - {a.name.slice(0, 18)}...
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-purple-400" />
                Active RBAC Role
              </label>
              <select
                value={selectedRole}
                onChange={handleRoleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
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
            <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-1 flex items-center gap-1">
              <Layers className="w-3 h-3 text-amber-400" />
              Quick Jump (All 60 Screens)
            </label>
            <select
              value={currentScreen}
              onChange={e => onNavigate(e.target.value)}
              className="w-full bg-slate-950 border border-cyan-500/40 rounded-md px-2 py-1.5 text-cyan-300 font-medium text-xs focus:outline-none focus:border-cyan-400"
            >
              {allScreensList.map(s => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status info bar */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            <span>
              Queue: <b className="text-cyan-400">{db.syncQueue.length} items</b>
            </span>
            <span>
              Seats: <b className="text-emerald-400">{db.seats.length}</b> | Students: <b className="text-blue-400">{db.students.length}</b>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
