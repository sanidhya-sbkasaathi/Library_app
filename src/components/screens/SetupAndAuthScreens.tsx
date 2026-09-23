import React, { useState } from 'react';
import {
  BookOpen,
  Building,
  CheckCircle2,
  Shield,
  Laptop,
  Lock,
  ArrowRight,
  Sparkles,
  Users,
  Settings,
  Printer,
  Calendar,
  Layers,
  Key,
} from 'lucide-react';
import { db } from '../../db/localDatabase';

// ----------------------------------------------------
// Screen 02: Welcome / Installation Screen
// ----------------------------------------------------
export const WelcomeScreen: React.FC<{ onNavigate: (s: string) => void }> = ({ onNavigate }) => {
  return (
    <div className="max-w-2xl mx-auto py-12 text-center space-y-6 animate-in fade-in duration-300">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center mx-auto shadow-2xl shadow-cyan-500/30">
        <BookOpen className="w-10 h-10 text-white" />
      </div>
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Library Management System
        </h1>
        <p className="text-sm text-cyan-600 dark:text-cyan-300 font-medium mt-1">Smart Libraries • Better Learning</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
          Windows Desktop Enterprise Platform. Operates 100% offline with local SQLite database and automated cloud backup.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/70 shadow-xl text-left space-y-3 text-xs">
        <div className="flex items-center gap-2 text-slate-800 dark:text-white font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          Offline-First Architecture: Zero internet downtime
        </div>
        <div className="flex items-center gap-2 text-slate-800 dark:text-white font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          50 Associations × 500 Students (25,000 students scalable)
        </div>
        <div className="flex items-center gap-2 text-slate-800 dark:text-white font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          Thermal 80mm & A4 Hardware Direct Printing
        </div>
      </div>

      <button
        onClick={() => onNavigate('dashboard')}
        className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-bold rounded-2xl shadow-xl shadow-cyan-500/25 transition"
      >
        Launch Operational Dashboard
      </button>
    </div>
  );
};

// ----------------------------------------------------
// Screen 04: Initial Setup Wizard
// ----------------------------------------------------
export const SetupWizardScreen: React.FC<{ onNavigate: (s: string) => void }> = ({ onNavigate }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const steps = ['Library Config', 'Rooms', 'Seats', 'Plans', 'Working Hours', 'Printer', 'Finish'];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8 animate-in fade-in duration-300">
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/70 shadow-xl">
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          Initial Association Setup Wizard
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure rooms, seat matrices, membership tiers, and printer hardware
        </p>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold">
        {steps.map((st, i) => (
          <div
            key={i}
            className={`p-2 rounded-lg border transition ${
              currentStep === i + 1
                ? 'bg-cyan-500/15 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500'
                : 'bg-slate-100 dark:bg-slate-900/60 text-slate-500 dark:text-slate-500 border-slate-200 dark:border-slate-800'
            }`}
          >
            {st}
          </div>
        ))}
      </div>

      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/70 shadow-xl space-y-4 text-xs">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white">Step {currentStep}: {steps[currentStep - 1]}</h3>
        <p className="text-slate-600 dark:text-slate-400">
          Default seed records are pre-populated from Knowledge Library's standard configuration.
        </p>

        <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold disabled:opacity-30 transition"
          >
            Previous
          </button>
          <button
            onClick={() => {
              if (currentStep < 7) {
                setCurrentStep(currentStep + 1);
              } else {
                onNavigate('dashboard');
              }
            }}
            className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-bold flex items-center gap-1.5 transition shadow"
          >
            {currentStep === 7 ? 'Complete Setup' : 'Next Step'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// Screen 05: Login & Authentication Screen
// ----------------------------------------------------
export const LoginScreen: React.FC<{ onNavigate: (s: string) => void }> = ({ onNavigate }) => {
  const [email, setEmail] = useState('rahul.sharma@knowledgelibrary.com');
  const [pin, setPin] = useState('1234');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('dashboard');
  };

  return (
    <div className="max-w-md mx-auto py-12 space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center mx-auto shadow-xl shadow-cyan-500/20">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Welcome Back</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Sign in to your authorized local desktop session</p>
      </div>

      <form onSubmit={handleLogin} className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/70 shadow-xl space-y-4 text-xs">
        <div>
          <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Username / Email</label>
          <input
            type="text"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Security PIN / Password</label>
          <input
            type="password"
            value={pin}
            onChange={e => setPin(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-cyan-500" />
            Remember this PC
          </label>
          <span className="text-cyan-600 dark:text-cyan-400 cursor-pointer hover:underline font-medium">Forgot PIN?</span>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 text-xs transition"
        >
          Login (Offline Authorized)
        </button>

        <div className="pt-2 text-center text-[10px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800">
          ● Local Database Active • Device ID: Reception PC
        </div>
      </form>
    </div>
  );
};
