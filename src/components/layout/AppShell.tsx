import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  LayoutDashboard,
  Users,
  UserPlus,
  CreditCard,
  Building,
  Armchair,
  Calendar,
  ArrowRightLeft,
  Lock,
  CheckSquare,
  TrendingUp,
  UserCheck,
  Palmtree,
  AlertTriangle,
  Bell,
  FileText,
  Printer,
  Folder,
  HardDrive,
  RefreshCw,
  ShieldCheck,
  Settings,
  Search,
  Wifi,
  WifiOff,
  ChevronDown,
  Minus,
  Square,
  X,
  Sun,
  Moon,
  Monitor,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Clock,
  Crown,
  ArrowRight,
  LogOut,
  Building2,
  Menu,
  Database,
} from 'lucide-react';
import { db } from '../../db/localDatabase';
import { Role, ThemeMode } from '../../types';
import { SupabaseClient } from '../../utils/supabaseClient';
import { isScreenPermitted, ROLE_META } from '../../utils/rolePermissions';

interface AppShellProps {
  children: React.ReactNode;
  currentScreen: string;
  onNavigate: (screenId: string) => void;
  activeReceiptTx?: any;
  onOpenSearch?: () => void;
  isOnboarding?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  currentScreen,
  onNavigate,
  activeReceiptTx,
  onOpenSearch = () => {},
  isOnboarding: propIsOnboarding,
}) => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudSyncToast, setCloudSyncToast] = useState<string | null>(null);

  // Auto-close dropdown on outside click or escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setProfileMenuOpen(false);
        setMobileNavOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isOnboarding = propIsOnboarding ?? (
    currentScreen.startsWith('onboarding') ||
    currentScreen === 'welcome' ||
    currentScreen === 'setup-wizard' ||
    currentScreen === 'login'
  );

  const isUnbound = db.bindingState === 'UNBOUND';

  const handleTriggerCloudSync = async () => {
    if (isCloudSyncing) return;
    setIsCloudSyncing(true);
    setCloudSyncToast('Syncing with Supabase Cloud...');
    try {
      const cfg = db.supabaseConfig;
      if (!cfg || !cfg.url || !cfg.anonKey) {
        setCloudSyncToast('Offline mode. Connect to Supabase Cloud in Database settings.');
        return;
      }
      const res = await SupabaseClient.pushSyncQueue(cfg, db.syncQueue);
      if (res.success) {
        setCloudSyncToast(
          res.syncedItemsCount > 0
            ? `✓ Synced! Pushed ${res.syncedItemsCount} queue records to Supabase.`
            : `✓ Cloud Synced: All records up to date.`
        );
      } else {
        setCloudSyncToast(`⚠️ ${res.error || 'Sync incomplete'}`);
      }
    } catch (err: any) {
      setCloudSyncToast(`Sync error: ${err.message || 'Network failure'}`);
    } finally {
      setIsCloudSyncing(false);
      setTimeout(() => setCloudSyncToast(null), 4000);
    }
  };

  const currentAssoc = db.getCurrentAssociation();

  // Consolidated Navigation Items (No duplicate views)
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'admissions', label: 'Admissions', icon: UserPlus },
    { id: 'memberships', label: 'Memberships', icon: CreditCard },
    { id: 'seats', label: 'Seats & Hall Management', icon: Armchair },
    { id: 'lockers', label: 'Lockers', icon: Lock },
    { id: 'attendance-live', label: 'Attendance', icon: CheckSquare },
    { id: 'fees-dashboard', label: 'Fees & Financials', icon: CreditCard },
    { id: 'staff', label: 'Staff & Role Digital Signatures', icon: ShieldCheck },
    { id: 'visitors', label: 'Visitors', icon: UserCheck },
    { id: 'leave', label: 'Leave', icon: Palmtree },
    { id: 'complaints', label: 'Complaints', icon: AlertTriangle },
    { id: 'notices', label: 'Notices', icon: Bell },
    { id: 'reports-dashboard', label: 'Reports', icon: FileText },
    { id: 'qr-id-cards', label: 'QR / ID / Printing', icon: Printer },
    { id: 'documents', label: 'Documents', icon: Folder },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: 5 },
    { id: 'backup-center', label: 'Backup & Restore', icon: HardDrive },
    { id: 'supabase-db-management', label: 'Database & Cloud', icon: Database },
    { id: 'sync-center', label: 'Sync & Devices', icon: RefreshCw },
  ];

  const currentRole: Role = (db.currentUser?.role as Role) || (db.boundRole as Role) || 'Owner';
  const customPermissions = db.boundCredentialEnvelope?.permissions || db.currentUser?.permissions || [];
  const roleMeta = ROLE_META[currentRole] || ROLE_META['Viewer'];

  // Strict Role Permissions: Only show nav items the active role is permitted to see
  const visibleNavItems = navItems.filter(item => isScreenPermitted(item.id, currentRole, customPermissions));

  // Full-bleed standalone immersive experience for Image 1 landing screen
  if (currentScreen === 'onboarding-landing') {
    return (
      <div className="min-h-screen w-full overflow-y-auto overflow-x-hidden bg-slate-950 text-slate-100 font-sans">
        {children}
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      {/* 1. TOP BAR (Matching Image 3: Windows Bar + Brand + Search + Connectivity + User Profile) */}
      <header className="h-14 bg-white/95 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800/80 backdrop-blur-xl flex items-center justify-between px-3 sm:px-4 z-30 shrink-0 shadow-xs">
        {/* Left: Hamburger (Mobile) + Brand Logo & Title */}
        <div className="flex items-center gap-2 sm:gap-3">
          {!isOnboarding && (
            <button
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/20 text-white shrink-0">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-xs sm:text-sm tracking-tight text-slate-900 dark:text-white truncate">
                Library Management System
              </h1>
            </div>
            <p className="text-[9px] sm:text-[10px] text-cyan-600 dark:text-cyan-400 font-medium tracking-wide truncate">
              Smart Libraries • Better Learning
            </p>
          </div>
        </div>

        {/* Center: Global Search Bar (Ctrl+K) OR Onboarding Authority Badge */}
        {isOnboarding ? (
          <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-50/80 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60 text-xs text-cyan-700 dark:text-cyan-300 font-medium">
            <ShieldCheck className="w-4 h-4 text-cyan-500" />
            <span>Cryptographic Onboarding Authority • Root: management-v1</span>
          </div>
        ) : (
          <div
            onClick={onOpenSearch}
            className="flex-1 max-w-md mx-6 hidden md:flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-500 dark:text-slate-400 hover:border-cyan-500/60 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer shadow-inner transition"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
              <span>Search students, seats, receipts, etc...</span>
            </div>
            <kbd className="px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-xs">
              Ctrl + K
            </kbd>
          </div>
        )}

        {/* Right: Theme Switcher, Connectivity Status, Bell, User Profile */}
        <div className="flex items-center gap-3">
          {/* Header Theme Switcher (Light / System / Dark) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900/90 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <button
              onClick={() => db.setTheme('light')}
              title="Light Theme"
              className={`p-1.5 rounded-xl transition ${
                db.theme === 'light'
                  ? 'bg-white text-amber-500 shadow-xs font-bold'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => db.setTheme('system')}
              title="System Theme"
              className={`p-1.5 rounded-xl transition ${
                db.theme === 'system'
                  ? 'bg-white dark:bg-slate-800 text-blue-500 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => db.setTheme('dark')}
              title="Dark Theme"
              className={`p-1.5 rounded-xl transition ${
                db.theme === 'dark'
                  ? 'bg-slate-950 text-cyan-400 shadow-xs font-bold'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Connectivity & Synchronization Pill */}
          <div
            onClick={() => !isOnboarding && onNavigate('sync-center')}
            className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 text-xs ${
              isOnboarding ? '' : 'cursor-pointer hover:border-cyan-500/50'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                !db.isOnline
                  ? 'bg-rose-500'
                  : isCloudSyncing
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-emerald-500 shadow-[0_0_8px_#34d399]'
              }`}
            />
            <div className="text-left">
              <span className="font-semibold text-slate-800 dark:text-white text-[11px] block leading-tight">
                {!db.isOnline ? 'OFFLINE' : isCloudSyncing ? 'SYNCING...' : 'ONLINE'}
                {db.syncQueue.filter(q => q.status === 'PENDING').length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                    {db.syncQueue.filter(q => q.status === 'PENDING').length} Pending
                  </span>
                )}
              </span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 block leading-tight">
                {db.isOnline ? `Last sync: ${db.lastSyncTime}` : 'Local SQLite OPFS Active'}
              </span>
            </div>
          </div>

          {/* Online Sync Button */}
          {!isOnboarding && (
            <div className="relative">
              <button
                onClick={handleTriggerCloudSync}
                disabled={isCloudSyncing || !db.isOnline}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-[11px] shadow-sm shadow-blue-500/20 transition disabled:opacity-50"
                title="Trigger immediate sync from SQLite outbox to cloud"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">{isCloudSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
              </button>
              {cloudSyncToast && (
                <div className="absolute right-0 top-full mt-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-semibold whitespace-nowrap shadow-lg animate-in fade-in zoom-in-95 z-50">
                  {cloudSyncToast}
                </div>
              )}
            </div>
          )}

          {!isOnboarding && (
            <>
              {/* Notification Bell with Red Badge */}
              <button
                onClick={() => onNavigate('notifications')}
                className="relative p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                  5
                </span>
              </button>

              {/* User Profile */}
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition"
                >
                  <img
                    src={db.currentUser.avatar}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover border border-cyan-500/50"
                  />
                  <div className="text-left hidden lg:block">
                    <span className="font-bold text-xs text-slate-800 dark:text-white block leading-tight">
                      {db.currentUser.name}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight">
                      {db.currentUser.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>            {/* Profile Dropdown Menu */}
            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl z-50 text-xs space-y-2 animate-in fade-in zoom-in-95">
                {/* User & Current Association Header */}
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white block truncate">
                      {db.currentUser.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-mono font-bold">
                      {db.boundLibraryId || 'UNBOUND'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                    {db.currentUser.email}
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px] text-slate-500 dark:text-slate-400">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    <span className="truncate">{currentAssoc.name}</span>
                  </div>
                </div>

                {/* Library Switching Section */}
                <div className="pt-0.5 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 px-2 uppercase tracking-wider block">
                    Library Access
                  </span>

                  {/* Switch Library / Join as Owner */}
                  <button
                    onClick={() => {
                      onNavigate('onboarding-owner');
                      setProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl text-left bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-cyan-500/10 hover:from-amber-500/25 hover:to-cyan-500/20 border border-amber-500/30 transition group cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 shadow-inner">
                        <Crown className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white block group-hover:text-amber-500 dark:group-hover:text-amber-400 transition leading-tight">
                          Switch Library / Join as Owner
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight mt-0.5">
                          Verify payload & setup Supabase
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-amber-500 shrink-0 group-hover:translate-x-0.5 transition" />
                  </button>

                  {/* Join as Staff / Member */}
                  <button
                    onClick={() => {
                      onNavigate('onboarding-role');
                      setProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Join as Staff / Member</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Role ID</span>
                  </button>
                </div>

                {/* Theme / Appearance Section */}
                <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 px-2 uppercase tracking-wider block mb-1">
                    Theme / Appearance
                  </span>
                  <button
                    onClick={() => {
                      db.setTheme('light');
                      setProfileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition ${
                      db.theme === 'light'
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-amber-500" /> Light Mode
                    </span>
                    {db.theme === 'light' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />}
                  </button>
                  <button
                    onClick={() => {
                      db.setTheme('dark');
                      setProfileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition ${
                      db.theme === 'dark'
                        ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Moon className="w-4 h-4 text-cyan-500" /> Dark Mode
                    </span>
                    {db.theme === 'dark' && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500" />}
                  </button>
                  <button
                    onClick={() => {
                      db.setTheme('system');
                      setProfileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition ${
                      db.theme === 'system'
                        ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-purple-500" /> System Default
                    </span>
                    {db.theme === 'system' && <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />}
                  </button>
                </div>

                {/* Session Actions */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-1 space-y-0.5">
                  <button
                    onClick={() => {
                      onNavigate('login');
                      setProfileMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/20 font-medium flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out / Switch User</span>
                  </button>
                </div>
              </div>
            )}
            </div>
          </>
        )}

          {/* Windows Desktop Native Buttons (hidden on mobile) */}
          <div className="hidden lg:flex items-center pl-2 border-l border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
            <button className="p-1.5 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition">
              <Square className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 hover:text-white hover:bg-rose-600 rounded transition">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. MOBILE SIDEBAR DRAWER (Shown when mobileNavOpen is true) */}
      {!isOnboarding && mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileNavOpen(false)}
          />
          {/* Drawer Menu */}
          <div className="relative w-72 max-w-[85vw] bg-white dark:bg-[#090e1c] h-full flex flex-col justify-between shadow-2xl z-10 overflow-y-auto">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-extrabold text-xs text-slate-900 dark:text-white">Navigation</h2>
                  <p className="text-[10px] text-cyan-600 dark:text-cyan-400">{currentAssoc.name.split(' (')[0]}</p>
                </div>
              </div>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 space-y-1 overflow-y-auto flex-1">
              {visibleNavItems.map(item => {
                const Icon = item.icon;
                const isActive = currentScreen === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      setMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-3 border-t border-slate-200 dark:border-slate-800">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20">
                  <Building className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <span className="font-bold text-xs text-slate-800 dark:text-white block truncate">
                    {currentAssoc.name.split(' (')[0]}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold border ${roleMeta.badgeBg} ${roleMeta.badgeText} ${roleMeta.badgeBorder}`}>
                      {roleMeta.title}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      ● Authorized
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. MIDDLE CONTENT AREA: SIDEBAR + SCROLLABLE PAGE BODY */}
      <div className="flex-1 flex overflow-hidden min-w-0">
        {/* Persistent Desktop Sidebar (Hidden on mobile & during onboarding) */}
        {!isOnboarding && (
          <aside className="hidden md:flex w-60 bg-white dark:bg-[#090e1c] border-r border-slate-200 dark:border-slate-800/80 flex-col justify-between shrink-0 z-20 overflow-y-auto">
            {/* Nav List (Filtered to user's assigned role permissions) */}
            <div className="p-3 space-y-1">
              {visibleNavItems.map(item => {
                const Icon = item.icon;
                const isActive = currentScreen === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Bottom Sidebar Widget */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800/80">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20">
                  <Building className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <span className="font-bold text-xs text-slate-800 dark:text-white block truncate">
                    {currentAssoc.name.split(' (')[0]}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold border ${roleMeta.badgeBg} ${roleMeta.badgeText} ${roleMeta.badgeBorder}`}>
                      {roleMeta.title}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      ● Authorized
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Main Page Workspace */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 bg-slate-100/70 dark:bg-gradient-to-b dark:from-[#070d19] dark:via-[#091122] dark:to-[#070d19] min-w-0 w-full">
          {children}
        </main>
      </div>

      {/* 4. BOTTOM STATUS BAR (Matching Image 3) */}
      <footer className="h-9 bg-white dark:bg-[#080d1a] border-t border-slate-200 dark:border-slate-800/80 px-3 sm:px-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 z-30 shrink-0 overflow-x-auto">
        {/* Left */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            <span className="text-slate-700 dark:text-slate-300 font-medium">Online</span>
          </span>
          <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">|</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">SQLite OPFS</span>
          <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">|</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Queue: <b className="text-cyan-600 dark:text-cyan-400 font-mono">{db.syncQueue.length}</b>
          </span>
        </div>

        {/* Center: Learn • Grow • Succeed */}
        <div className="hidden md:block text-xs italic tracking-widest font-serif text-cyan-700 dark:text-cyan-300/80 font-medium">
          Learn • Grow • Succeed
        </div>

        {/* Right: Last backup and Sync Now */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden lg:inline">
            Last backup: 27 Apr 2025, 08:00 PM
          </span>
          <button
            onClick={handleTriggerCloudSync}
            disabled={!db.isOnline || isCloudSyncing}
            className="px-2.5 sm:px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[10px] sm:text-[11px] font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 disabled:opacity-40 transition cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isCloudSyncing ? 'animate-spin' : ''}`} />
            <span>{isCloudSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
