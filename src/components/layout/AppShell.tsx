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
} from 'lucide-react';
import { db } from '../../db/localDatabase';
import { ThemeMode } from '../../types';

interface AppShellProps {
  currentScreen: string;
  onNavigate: (screen: string, param?: any) => void;
  onOpenSearch: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentScreen,
  onNavigate,
  onOpenSearch,
  children,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [assocMenuOpen, setAssocMenuOpen] = useState(false);

  const currentAssoc = db.getCurrentAssociation();

  // Navigation Items matching Image 3 precisely
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'admissions', label: 'Admissions', icon: UserPlus },
    { id: 'memberships', label: 'Memberships', icon: CreditCard },
    { id: 'rooms', label: 'Rooms', icon: Building },
    { id: 'seats', label: 'Seats', icon: Armchair },
    { id: 'reservations', label: 'Reservations', icon: Calendar },
    { id: 'seat-transfer', label: 'Seat Transfer', icon: ArrowRightLeft },
    { id: 'lockers', label: 'Lockers', icon: Lock },
    { id: 'attendance-live', label: 'Attendance', icon: CheckSquare },
    { id: 'fees-dashboard', label: 'Fees & Payments', icon: CreditCard },
    { id: 'expenses', label: 'Income & Expenses', icon: TrendingUp },
    { id: 'staff', label: 'Staff', icon: Users },
    { id: 'visitors', label: 'Visitors', icon: UserCheck },
    { id: 'leave', label: 'Leave', icon: Palmtree },
    { id: 'complaints', label: 'Complaints', icon: AlertTriangle },
    { id: 'notices', label: 'Notices', icon: Bell },
    { id: 'reports-dashboard', label: 'Reports', icon: FileText },
    { id: 'qr-id-cards', label: 'QR / ID / Printing', icon: Printer },
    { id: 'documents', label: 'Documents', icon: Folder },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: 5 },
    { id: 'backup-center', label: 'Backup & Restore', icon: HardDrive },
    { id: 'sync-center', label: 'Sync & Devices', icon: RefreshCw },
    { id: 'audit-logs', label: 'Security & Audit', icon: ShieldCheck },
    { id: 'general-settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* 1. TOP BAR (Matching Image 3: Windows Bar + Brand + Search + Connectivity + User Profile) */}
      <header className="h-14 bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-xl flex items-center justify-between px-4 z-30 shrink-0">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/20 text-white">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-sm tracking-tight text-white">
                Library Management System
              </h1>
            </div>
            <p className="text-[10px] text-cyan-400 font-medium tracking-wide">
              Smart Libraries • Better Learning
            </p>
          </div>
        </div>

        {/* Center: Global Search Bar (Ctrl+K) */}
        <div
          onClick={onOpenSearch}
          className="flex-1 max-w-md mx-6 hidden md:flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs text-slate-400 hover:border-cyan-500/60 hover:text-slate-200 cursor-pointer shadow-inner transition"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-cyan-400" />
            <span>Search students, seats, receipts, etc...</span>
          </div>
          <kbd className="px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-400 bg-slate-800 border border-slate-700 rounded shadow-sm">
            Ctrl + K
          </kbd>
        </div>

        {/* Right: Connectivity Status, Bell, User Profile, Window Buttons */}
        <div className="flex items-center gap-3">
          {/* Connectivity Pill */}
          <div
            onClick={() => onNavigate('sync-center')}
            className="cursor-pointer hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                db.isOnline
                  ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                  : 'bg-rose-500'
              }`}
            />
            <div className="text-left">
              <span className="font-semibold text-white text-[11px] block leading-tight">
                {db.isOnline ? 'Internet Connected' : 'Offline Mode'}
              </span>
              <span className="text-[9px] text-slate-400 block leading-tight">
                {db.isOnline ? `Last sync: ${db.lastSyncTime}` : 'Local SQLite Active'}
              </span>
            </div>
          </div>

          {/* Notification Bell with Red Badge */}
          <button
            onClick={() => onNavigate('notifications')}
            className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition"
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
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-900 transition"
            >
              <img
                src={db.currentUser.avatar}
                alt=""
                className="w-8 h-8 rounded-full object-cover border border-cyan-500/50"
              />
              <div className="text-left hidden lg:block">
                <span className="font-bold text-xs text-white block leading-tight">
                  {db.currentUser.name}
                </span>
                <span className="text-[10px] text-slate-400 block leading-tight">
                  {db.currentUser.role}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Profile Dropdown Menu */}
            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 p-2 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl z-50 text-xs space-y-1 animate-in fade-in zoom-in-95">
                <div className="p-2 border-b border-slate-800">
                  <span className="font-bold text-white block">{db.currentUser.name}</span>
                  <span className="text-[11px] text-slate-400 block">{db.currentUser.email}</span>
                </div>

                <div className="pt-1">
                  <span className="text-[10px] font-semibold text-slate-500 px-2 uppercase tracking-wider block mb-1">
                    Theme / Appearance
                  </span>
                  <button
                    onClick={() => {
                      db.setTheme('light');
                      setProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
                  >
                    <Sun className="w-4 h-4 text-amber-400" /> Light Mode
                  </button>
                  <button
                    onClick={() => {
                      db.setTheme('dark');
                      setProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
                  >
                    <Moon className="w-4 h-4 text-cyan-400" /> Dark Mode
                  </button>
                  <button
                    onClick={() => {
                      db.setTheme('system');
                      setProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
                  >
                    <Monitor className="w-4 h-4 text-purple-400" /> System Default
                  </button>
                </div>

                <div className="border-t border-slate-800 pt-1">
                  <button
                    onClick={() => {
                      onNavigate('login');
                      setProfileMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-rose-300 hover:bg-rose-500/20 font-medium"
                  >
                    Sign Out / Switch User
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Windows Desktop Native Buttons */}
          <div className="flex items-center pl-2 border-l border-slate-800 text-slate-400">
            <button className="p-1.5 hover:text-white hover:bg-slate-800 rounded transition">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 hover:text-white hover:bg-slate-800 rounded transition">
              <Square className="w-3 h-3" />
            </button>
            <button className="p-1.5 hover:text-white hover:bg-rose-600 rounded transition">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. MIDDLE CONTENT AREA: SIDEBAR + SCROLLABLE PAGE BODY */}
      <div className="flex-1 flex overflow-hidden">
        {/* Persistent Desktop Sidebar */}
        <aside className="w-60 bg-[#090e1c] border-r border-slate-800/80 flex flex-col justify-between shrink-0 z-20 overflow-y-auto">
          {/* Nav List */}
          <div className="p-3 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
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
          <div className="p-3 border-t border-slate-800/80">
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Building className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <span className="font-bold text-xs text-white block truncate">
                  {currentAssoc.name.split(' (')[0]}
                </span>
                <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  v1.0.0 Online
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Page Workspace */}
        <main className="flex-1 overflow-y-auto p-5 bg-gradient-to-b from-[#070d19] via-[#091122] to-[#070d19]">
          {children}
        </main>
      </div>

      {/* 3. BOTTOM STATUS BAR (Matching Image 3) */}
      <footer className="h-9 bg-[#080d1a] border-t border-slate-800/80 px-4 flex items-center justify-between text-xs text-slate-400 z-30 shrink-0">
        {/* Left */}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-300 font-medium">System Online</span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-[11px] text-slate-400">SQLite (Local)</span>
          <span className="text-slate-600">|</span>
          <span className="text-[11px] text-slate-400">
            Queue: <b className="text-cyan-400 font-mono">{db.syncQueue.length}</b>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-[11px] font-mono text-slate-500">v1.0.0</span>
        </div>

        {/* Center: Learn • Grow • Succeed (Matching Image 3) */}
        <div className="hidden sm:block text-xs italic tracking-widest font-serif text-cyan-300/80">
          Learn • Grow • Succeed
        </div>

        {/* Right: Last backup and Sync Now glowing button */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400 hidden md:inline">
            Last backup: 27 Apr 2025, 08:00 PM
          </span>
          <button
            onClick={() => db.triggerSyncNow()}
            disabled={!db.isOnline || db.isSyncing}
            className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[11px] font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 disabled:opacity-40 transition"
          >
            <RefreshCw className={`w-3 h-3 ${db.isSyncing ? 'animate-spin' : ''}`} />
            Sync Now
          </button>
        </div>
      </footer>
    </div>
  );
};
