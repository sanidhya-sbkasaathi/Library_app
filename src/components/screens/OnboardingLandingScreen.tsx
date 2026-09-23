import React, { useState } from 'react';
import {
  BookOpen,
  Crown,
  User,
  ShieldCheck,
  Check,
  ArrowRight,
  Search,
  Wifi,
  Home,
  LayoutGrid,
  Layers,
  TrendingUp,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { db } from '../../db/localDatabase';

interface OnboardingLandingProps {
  onSelectOwner: () => void;
  onSelectRole: () => void;
  onExploreDemo?: () => void;
}

export const OnboardingLandingScreen: React.FC<OnboardingLandingProps> = ({
  onSelectOwner,
  onSelectRole,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'manage' | 'organize' | 'grow'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div
      className="relative min-h-screen w-full flex flex-col justify-between overflow-y-auto overflow-x-hidden font-display"
      style={{
        backgroundImage: `url('/assets/library_desk_bg.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 30%',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Ambient Depth Tint Overlay */}
      <div className="absolute inset-0 bg-slate-950/70 dark:bg-slate-950/75 backdrop-blur-[3px] pointer-events-none" />

      {/* 1. TOP NAVIGATION BAR (Matching Image 1) */}
      <header className="relative z-30 w-full px-4 sm:px-8 py-3 flex items-center justify-between border-b border-white/10 bg-slate-950/40 backdrop-blur-xl shrink-0">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25 border border-white/20">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-sm sm:text-base tracking-wide text-white block leading-tight">
              Library Management System
            </span>
            <span className="text-[10px] text-slate-300/80 font-medium tracking-wider uppercase block">
              Manage • Organize • Grow
            </span>
          </div>
        </div>

        {/* Center: Frosted Pill Search */}
        <div className="hidden md:flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs text-slate-300 w-72 lg:w-96 shadow-inner focus-within:border-cyan-400/80 focus-within:bg-white/15 transition">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search books, authors, or genres..."
            className="w-full bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white/10 rounded border border-white/20 text-slate-300 shrink-0">
            ⌘ K
          </kbd>
        </div>

        {/* Right: Security Pill, Offline Badge, Theme Switcher, Avatar */}
        <div className="flex items-center gap-3">
          {/* Security Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <div className="text-left leading-tight">
              <span className="font-bold text-[11px] block">Secure & Trusted</span>
              <span className="text-[9px] text-emerald-300/70 block">Ed25519 Cryptographic Verification</span>
            </div>
          </div>

          {/* Offline Ready Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-slate-200 text-xs shadow-sm">
            <Wifi className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-[11px]">Offline Ready</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
          </div>

          {/* Direct Theme Switcher */}
          <div className="flex items-center bg-white/10 p-1 rounded-2xl border border-white/15 shadow-sm">
            <button
              onClick={() => db.setTheme('light')}
              title="Light Theme"
              className={`p-1.5 rounded-xl transition cursor-pointer ${
                db.theme === 'light'
                  ? 'bg-white text-amber-500 shadow-sm font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => db.setTheme('system')}
              title="System Theme"
              className={`p-1.5 rounded-xl transition cursor-pointer ${
                db.theme === 'system'
                  ? 'bg-white/30 text-cyan-300 shadow-sm font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => db.setTheme('dark')}
              title="Dark Theme"
              className={`p-1.5 rounded-xl transition cursor-pointer ${
                db.theme === 'dark'
                  ? 'bg-slate-900 text-cyan-400 shadow-sm font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* User Profile Avatar */}
          <div className="w-8 h-8 rounded-full bg-white/15 border border-white/25 flex items-center justify-center text-slate-200 shadow-inner">
            <User className="w-4 h-4" />
          </div>
        </div>
      </header>

      {/* 2. MAIN CENTER HERO & CARDS AREA */}
      <div className="relative z-20 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 sm:py-7 flex flex-col items-center justify-start sm:justify-center">
        {/* Floating Left Pill Sidebar (Matching Image 1) */}
        <aside className="hidden xl:flex flex-col gap-2.5 absolute left-6 top-16 p-2 rounded-2xl bg-slate-950/45 backdrop-blur-xl border border-white/15 shadow-2xl w-40">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-white/20 text-white border border-white/25 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Home className="w-4 h-4 text-cyan-400" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'manage'
                ? 'bg-white/20 text-white border border-white/25 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <LayoutGrid className="w-4 h-4 text-indigo-400" />
            <span>Manage</span>
          </button>
          <button
            onClick={() => setActiveTab('organize')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'organize'
                ? 'bg-white/20 text-white border border-white/25 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Organize</span>
          </button>
          <button
            onClick={() => setActiveTab('grow')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'grow'
                ? 'bg-white/20 text-white border border-white/25 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Grow</span>
          </button>
        </aside>

        {/* Handwritten Accent Note on Top Right (Matching Image 1) */}
        <div className="hidden xl:block absolute right-8 top-12 rotate-6 font-handwriting text-2xl text-[#fcedd7] tracking-wider drop-shadow-md select-none pointer-events-none">
          <div className="text-right leading-tight">
            Knowledge<br />Builds a<br />Better You ♥
          </div>
          <svg
            className="w-10 h-7 ml-auto text-[#fcedd7] opacity-80 mt-1"
            viewBox="0 0 50 30"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          >
            <path d="M 8 6 Q 26 24 44 14 M 38 10 L 44 14 L 37 19" />
          </svg>
        </div>

        {/* Hero Title & Script Divider */}
        <div className="text-center max-w-2xl mx-auto mb-5 sm:mb-6 space-y-1.5">
          <div className="inline-flex items-center px-4 py-1 rounded-full bg-white/10 border border-white/15 text-slate-200 text-xs font-medium backdrop-blur-md shadow-xs">
            Welcome to
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white drop-shadow-lg">
            Library <span className="text-champagne-gold">Management System</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium">
            Choose how you want to access and manage your library
          </p>
          <div className="flex items-center justify-center gap-2 pt-0.5 text-xs italic text-slate-400/90 font-serif">
            <span className="w-12 h-px bg-slate-500/40" />
            <span>Your Library • Your Control</span>
            <span className="w-12 h-px bg-slate-500/40" />
          </div>
        </div>

        {/* The Two Hero Selection Cards (Matching Image 1) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-7 max-w-4xl mx-auto w-full">
          {/* CARD 1: LIBRARY OWNER (Recommended) */}
          <div className="glass-onboarding-card relative p-5 sm:p-6 rounded-3xl flex flex-col justify-between group border border-white/15 shadow-2xl">
            {/* Recommended Pill Badge */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-[11px] font-bold text-amber-200 backdrop-blur-md shadow-xs">
              <Crown className="w-3 h-3 text-amber-300" />
              Recommended
            </div>

            <div>
              {/* 3D Illustration */}
              <div className="relative w-full h-36 sm:h-40 md:h-44 rounded-2xl overflow-hidden mb-4 bg-slate-950/40 border border-white/10 flex items-center justify-center">
                <img
                  src="/assets/owner_books_crown.jpg"
                  alt="Library Owner 3D Books with Crown & Security Shield"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
              </div>

              {/* Title Row */}
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
                  <Crown className="w-4 h-4" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Library Owner
                </h2>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300/90 mb-3.5 leading-relaxed">
                Full access to manage the library, users, books, inventory, reports and settings.
              </p>

              {/* Feature Checklist */}
              <ul className="space-y-1.5 sm:space-y-2 text-xs text-slate-200">
                <li className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-blue-300 stroke-[3]" />
                  </div>
                  <span>Manage library details</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-blue-300 stroke-[3]" />
                  </div>
                  <span>Add / remove users</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-blue-300 stroke-[3]" />
                  </div>
                  <span>Manage books & inventory</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-blue-300 stroke-[3]" />
                  </div>
                  <span>View reports & analytics</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-blue-300 stroke-[3]" />
                  </div>
                  <span>System configuration</span>
                </li>
              </ul>
            </div>

            {/* Action Button: Warm Champagne Pill */}
            <button
              onClick={onSelectOwner}
              className="w-full mt-5 py-2.5 sm:py-3 px-5 rounded-full bg-champagne-pill text-[#2a1b0d] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg"
            >
              <span>Select Library Owner</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* CARD 2: LIBRARY USER (Role Flow) */}
          <div className="glass-onboarding-card relative p-5 sm:p-6 rounded-3xl flex flex-col justify-between group border border-white/15 shadow-2xl">
            <div>
              {/* 3D Illustration */}
              <div className="relative w-full h-36 sm:h-40 md:h-44 rounded-2xl overflow-hidden mb-4 bg-slate-950/40 border border-white/10 flex items-center justify-center">
                <img
                  src="/assets/user_books_team.jpg"
                  alt="Library User 3D Books with User Avatar Bubble"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
              </div>

              {/* Title Row */}
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-cyan-300 shrink-0 shadow-inner">
                  <User className="w-4 h-4" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Library User
                </h2>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300/90 mb-3.5 leading-relaxed">
                Access library resources, borrow books, and manage your reading list.
              </p>

              {/* Feature Checklist */}
              <ul className="space-y-1.5 sm:space-y-2 text-xs text-slate-200">
                <li className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-blue-300 stroke-[3]" />
                  </div>
                  <span>Search & browse books</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-blue-300 stroke-[3]" />
                  </div>
                  <span>Borrow / return books</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-blue-300 stroke-[3]" />
                  </div>
                  <span>View your history</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-blue-300 stroke-[3]" />
                  </div>
                  <span>Manage profile</span>
                </li>
              </ul>
            </div>

            {/* Action Button: Frosted Glass Outline Pill */}
            <button
              onClick={onSelectRole}
              className="w-full mt-5 py-2.5 sm:py-3 px-5 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Select Library User</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* 3. BOTTOM TRUST & CAPABILITY CAPSULE (Matching Image 1) */}
        <div className="max-w-3xl mx-auto w-full mt-6 sm:mt-8 p-2 sm:p-2.5 rounded-full bg-slate-950/50 backdrop-blur-xl border border-white/15 flex flex-col sm:flex-row items-center justify-between divide-y sm:divide-y-0 sm:divide-x divide-white/10 text-xs text-slate-300 shadow-2xl shrink-0">
          {/* Capsule 1: Secure & Trusted */}
          <div className="flex items-center gap-3 px-4 py-1.5 w-full sm:w-1/3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <span className="font-bold text-white block text-xs truncate">Secure & Trusted</span>
              <span className="text-[10px] text-slate-400 block truncate">Ed25519 Cryptographic Verification</span>
            </div>
          </div>

          {/* Capsule 2: Works Offline */}
          <div className="flex items-center gap-3 px-4 py-1.5 w-full sm:w-1/3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0 border border-cyan-500/30">
              <Wifi className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <span className="font-bold text-white block text-xs truncate">Works Offline</span>
              <span className="text-[10px] text-slate-400 block truncate">Access without Internet</span>
            </div>
          </div>

          {/* Capsule 3: Multi-Library Support */}
          <div className="flex items-center gap-3 px-4 py-1.5 w-full sm:w-1/3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0 border border-indigo-500/30">
              <Layers className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <span className="font-bold text-white block text-xs truncate">Multi-Library Support</span>
              <span className="text-[10px] text-slate-400 block truncate">Manage multiple libraries</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
