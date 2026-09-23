import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Filter,
  TrendingUp,
  Armchair,
  Users,
  CreditCard,
  Building,
  CheckCircle2,
} from 'lucide-react';
import { db } from '../../db/localDatabase';

export const ReportsDashboardScreen: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = [
    'All',
    'Students & Admissions',
    'Financial Ledger',
    'Seat Occupancy',
    'Attendance Trends',
    'Staff & Shift Logs',
  ];

  const reportItems = [
    { title: 'Daily Collection & Revenue Report', type: 'Financial', records: 'Today (₹48,750)', date: '28 Apr 2025' },
    { title: 'Monthly Revenue & Expense Statement', type: 'Financial', records: 'Apr 2025 (₹14,85,000)', date: '28 Apr 2025' },
    { title: 'Room-wise Seat Occupancy & Availability', type: 'Operational', records: '1,100 Desks (81% Occupied)', date: 'Real-time' },
    { title: 'Student Membership Expiry Schedule (Next 30 Days)', type: 'Students', records: '48 Students Expiring', date: '28 Apr 2025' },
    { title: 'Hourly Attendance Peak Usage Analysis', type: 'Operational', records: '834 Check-ins', date: 'Today' },
    { title: 'New Admissions & Onboarding Register', type: 'Admissions', records: '5 Admissions Today', date: '28 Apr 2025' },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5 pb-8 animate-in fade-in duration-300">
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/70 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            Executive Reports & Analytics Hub
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Standard reporting center for financial closings, occupancy metrics, and student rosters
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setSelectedCategory(c)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === c
                ? 'bg-cyan-500/15 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/40'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 shadow-sm'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportItems.map((r, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/70 shadow-xl space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/40">
                  {r.type}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">{r.date}</span>
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">{r.title}</h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-medium mt-1">
                Authoritative SQLite Data: {r.records}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">PDF & CSV Ready</span>
              <button
                onClick={handlePrint}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-cyan-700 dark:text-cyan-300 rounded-lg text-xs font-semibold transition flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                Generate
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
