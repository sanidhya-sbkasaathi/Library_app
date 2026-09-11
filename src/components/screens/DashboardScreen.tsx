import React, { useState } from 'react';
import {
  Users,
  Armchair,
  CheckSquare,
  TrendingUp,
  CreditCard,
  Sun,
  CloudSun,
  Clock,
  Calendar,
  Bell,
  ArrowRight,
  UserPlus,
  PlusCircle,
  FileCheck,
  RotateCw,
  Sparkles,
  ChevronRight,
  ArrowUpRight,
  IndianRupee,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { db } from '../../db/localDatabase';
import { PaymentTransaction } from '../../types';

interface DashboardScreenProps {
  onNavigate: (screen: string, param?: any) => void;
  onOpenReceipt: (tx: PaymentTransaction) => void;
  onOpenQRScanner: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigate,
  onOpenReceipt,
  onOpenQRScanner,
}) => {
  const [growthTimeframe, setGrowthTimeframe] = useState('6 Months');

  // Student growth chart data (matching Image 3)
  const growthData = [
    { month: 'Nov', total: 680, active: 620, new: 55 },
    { month: 'Dec', total: 840, active: 780, new: 68 },
    { month: 'Jan', total: 990, active: 910, new: 82 },
    { month: 'Feb', total: 1080, active: 1020, new: 74 },
    { month: 'Mar', total: 1160, active: 1100, new: 88 },
    { month: 'Apr', total: 1248, active: 1186, new: 92 },
  ];

  // Seat occupancy pie data (matching Image 3: 1,100 Total, 892 Occupied, 208 Available, 42 Reserved, 18 Blocked, 6 Maint)
  const occupancyPieData = [
    { name: 'Occupied', value: 892, color: '#3b82f6', percent: '81%' },
    { name: 'Available', value: 208, color: '#10b981', percent: '19%' },
    { name: 'Reserved', value: 42, color: '#f59e0b', percent: '4%' },
    { name: 'Blocked', value: 18, color: '#ef4444', percent: '2%' },
    { name: 'Maintenance', value: 6, color: '#64748b', percent: '1%' },
  ];

  // Attendance hourly data
  const attendanceHourlyData = [
    { time: '8 AM', present: 180, absent: 30 },
    { time: '9 AM', present: 420, absent: 50 },
    { time: '10 AM', present: 680, absent: 80 },
    { time: '11 AM', present: 810, absent: 110 },
    { time: '12 PM', present: 834, absent: 127 },
    { time: '1 PM', present: 760, absent: 140 },
    { time: '2 PM', present: 790, absent: 130 },
    { time: '3 PM', present: 810, absent: 120 },
    { time: '4 PM', present: 740, absent: 110 },
    { time: '5 PM', present: 620, absent: 90 },
  ];

  const attendancePieData = [
    { name: 'Present', value: 834, color: '#10b981' },
    { name: 'Absent', value: 127, color: '#f43f5e' },
    { name: 'Late', value: 42, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-5 pb-8 animate-in fade-in duration-300">
      {/* 1. HERO AMBIENT BANNER (Exact Match to Image 3) */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-700/60 shadow-2xl min-h-[160px] flex items-center bg-slate-900">
        {/* Photographic background with dark gradient lighting */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity scale-105 transition-transform duration-1000"
          style={{ backgroundImage: `url('/library_hero_bg.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />

        {/* Content */}
        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-400 animate-spin-slow" />
              <span className="text-sm font-medium text-amber-300/90">Good Morning,</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
              Rahul Sharma!
            </h1>
            <p className="text-xs md:text-sm text-slate-300/90 font-medium">
              Knowledge builds a better tomorrow
            </p>

            {/* Date & Weather Pills */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/70 text-xs text-slate-300 backdrop-blur-md">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>Mon, 28 Apr 2025</span>
                <span className="text-slate-500">|</span>
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>10:32 AM</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/70 text-xs text-slate-300 backdrop-blur-md">
                <CloudSun className="w-3.5 h-3.5 text-amber-400" />
                <span>22°C Partly Cloudy</span>
              </div>
            </div>
          </div>

          {/* Right Quote Pill */}
          <div className="hidden lg:block max-w-xs text-right p-4 rounded-2xl bg-slate-900/60 border border-slate-700/60 backdrop-blur-md shadow-lg">
            <p className="text-xs italic text-cyan-200/90 font-serif leading-relaxed">
              "A library is a hospital for the mind."
            </p>
            <span className="text-[11px] text-slate-400 block mt-1 font-medium font-sans">
              — Anonymous
            </span>
          </div>
        </div>
      </div>

      {/* 2. SIX GLOWING KPI STAT CARDS (Exact match to Image 3) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Students */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600/20 via-slate-900 to-slate-950 border border-blue-500/30 hover:border-blue-500/60 shadow-lg hover:shadow-blue-500/10 transition group cursor-pointer"
             onClick={() => onNavigate('students')}>
          <div className="flex items-center justify-between mb-2">
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 group-hover:scale-110 transition">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-emerald-400 flex items-center">
              ↑ 12%
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium block">Total Students</span>
          <span className="text-xl font-extrabold text-white tracking-tight mt-0.5 block">1,248</span>
        </div>

        {/* Active Students */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600/20 via-slate-900 to-slate-950 border border-emerald-500/30 hover:border-emerald-500/60 shadow-lg hover:shadow-emerald-500/10 transition group cursor-pointer"
             onClick={() => onNavigate('students')}>
          <div className="flex items-center justify-between mb-2">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-emerald-400 flex items-center">
              ↑ 10%
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium block">Active Students</span>
          <span className="text-xl font-extrabold text-white tracking-tight mt-0.5 block">1,186</span>
        </div>

        {/* Occupied Seats */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-600/20 via-slate-900 to-slate-950 border border-purple-500/30 hover:border-purple-500/60 shadow-lg hover:shadow-purple-500/10 transition group cursor-pointer"
             onClick={() => onNavigate('seats')}>
          <div className="flex items-center justify-between mb-2">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 group-hover:scale-110 transition">
              <Armchair className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-emerald-400 flex items-center">
              ↑ 8%
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium block">Occupied Seats</span>
          <span className="text-xl font-extrabold text-white tracking-tight mt-0.5 block">892</span>
        </div>

        {/* Available Seats */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-600/20 via-slate-900 to-slate-950 border border-amber-500/30 hover:border-amber-500/60 shadow-lg hover:shadow-amber-500/10 transition group cursor-pointer"
             onClick={() => onNavigate('seats')}>
          <div className="flex items-center justify-between mb-2">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 group-hover:scale-110 transition">
              <Armchair className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-emerald-400 flex items-center">
              ↑ 15%
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium block">Available Seats</span>
          <span className="text-xl font-extrabold text-white tracking-tight mt-0.5 block">208</span>
        </div>

        {/* Today's Attendance */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-600/20 via-slate-900 to-slate-950 border border-cyan-500/30 hover:border-cyan-500/60 shadow-lg hover:shadow-cyan-500/10 transition group cursor-pointer"
             onClick={() => onNavigate('attendance-live')}>
          <div className="flex items-center justify-between mb-2">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 group-hover:scale-110 transition">
              <CheckSquare className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-emerald-400 flex items-center">
              ↑ 6%
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium block">Today's Attendance</span>
          <span className="text-xl font-extrabold text-white tracking-tight mt-0.5 block">834</span>
        </div>

        {/* Today's Collection */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-600/20 via-slate-900 to-slate-950 border border-pink-500/30 hover:border-pink-500/60 shadow-lg hover:shadow-pink-500/10 transition group cursor-pointer"
             onClick={() => onNavigate('fees-dashboard')}>
          <div className="flex items-center justify-between mb-2">
            <div className="p-2.5 rounded-xl bg-pink-500/20 text-pink-400 group-hover:scale-110 transition">
              <IndianRupee className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-emerald-400 flex items-center">
              ↑ 20%
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium block">Today's Collection</span>
          <span className="text-xl font-extrabold text-white tracking-tight mt-0.5 block">₹ 48,750</span>
        </div>
      </div>

      {/* 3. MAIN DASHBOARD GRID WITH RIGHT INTELLIGENCE SIDEBAR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 9 Columns: Charts & Tables */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-5">
          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Student Growth Line Chart (7 Cols) */}
            <div className="md:col-span-7 p-5 rounded-2xl bg-slate-900/90 border border-slate-700/70 shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    Student Growth
                  </h3>
                  <p className="text-xs text-slate-400">Last 6 Months progression</p>
                </div>
                <select
                  value={growthTimeframe}
                  onChange={e => setGrowthTimeframe(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-300 px-2.5 py-1 focus:outline-none focus:border-cyan-500"
                >
                  <option value="6 Months">6 Months</option>
                  <option value="1 Year">1 Year</option>
                  <option value="30 Days">30 Days</option>
                </select>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} domain={[0, 1500]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        fontSize: '11px',
                        color: '#f8fafc',
                      }}
                    />
                    <Line type="monotone" dataKey="total" name="Total Students" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} />
                    <Line type="monotone" dataKey="active" name="Active Students" stroke="#a855f7" strokeWidth={2.5} dot={{ fill: '#a855f7', r: 3 }} />
                    <Line type="monotone" dataKey="new" name="New Admissions" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Legend row */}
              <div className="flex justify-center gap-4 mt-3 text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Total Students
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Active Students
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> New Admissions
                </span>
              </div>
            </div>

            {/* Seat Occupancy Donut Chart (5 Cols) */}
            <div className="md:col-span-5 p-5 rounded-2xl bg-slate-900/90 border border-slate-700/70 shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <Armchair className="w-4 h-4 text-purple-400" />
                    Seat Occupancy
                  </h3>
                  <p className="text-xs text-slate-400">Total Seats 1,100</p>
                </div>
                <span className="text-xs text-cyan-400 font-semibold px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20">
                  All Rooms
                </span>
              </div>

              <div className="relative h-48 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={occupancyPieData}
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {occupancyPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        fontSize: '11px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Percent Label */}
                <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-extrabold text-white">81%</span>
                  <span className="text-[10px] text-slate-400 font-medium">Occupied</span>
                </div>
              </div>

              {/* Breakdown List */}
              <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-2 border-t border-slate-800">
                {occupancyPieData.map(item => (
                  <div key={item.name} className="flex items-center justify-between p-1 rounded bg-slate-950/40">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </span>
                    <span className="font-mono text-slate-400">
                      {item.value} ({item.percent})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tables Row: Recent Admissions & Recent Payments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Recent Admissions Table */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700/70 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-cyan-400" />
                  Recent Admissions
                </h3>
                <button
                  onClick={() => onNavigate('admissions')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                >
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="pb-2">#</th>
                      <th className="pb-2">Student Name</th>
                      <th className="pb-2">Plan</th>
                      <th className="pb-2">Seat</th>
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {db.admissions.slice(0, 5).map((adm, i) => (
                      <tr key={adm.id} className="hover:bg-slate-800/40 transition cursor-pointer"
                          onClick={() => onNavigate('admissions')}>
                        <td className="py-2.5 text-slate-500 font-mono">{i + 1}</td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[10px]">
                              {adm.studentName[0]}
                            </div>
                            <span className="font-semibold text-white">{adm.studentName}</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-slate-300">{adm.planName.split(' ')[0]} {adm.planName.split(' ')[1] || ''}</td>
                        <td className="py-2.5">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono font-medium">
                            {adm.seatNumber}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-400">{adm.date}</td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {adm.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Payments Table */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700/70 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  Recent Payments
                </h3>
                <button
                  onClick={() => onNavigate('transactions')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                >
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="pb-2">#</th>
                      <th className="pb-2">Student Name</th>
                      <th className="pb-2">Amount</th>
                      <th className="pb-2">Method</th>
                      <th className="pb-2">Date</th>
                      <th className="pb-2 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {db.payments.slice(0, 5).map((pay, i) => (
                      <tr key={pay.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-2.5 text-slate-500 font-mono">{i + 1}</td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-[10px]">
                              {pay.studentName[0]}
                            </div>
                            <span className="font-semibold text-white">{pay.studentName}</span>
                          </div>
                        </td>
                        <td className="py-2.5 font-bold font-mono text-emerald-400">
                          ₹ {pay.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              pay.method === 'UPI'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : pay.method === 'Cash'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            }`}
                          >
                            {pay.method}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-400">{pay.date}</td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => onOpenReceipt(pay)}
                            className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded transition"
                          >
                            Print
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Lower Row: Attendance Overview + Upcoming Membership Expiry */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Attendance Overview (7 Cols) */}
            <div className="md:col-span-7 p-5 rounded-2xl bg-slate-900/90 border border-slate-700/70 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-cyan-400" />
                    Attendance Overview
                  </h3>
                  <p className="text-xs text-slate-400">Hourly check-in analysis</p>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300">
                  Today
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                {/* Donut Left (5 cols) */}
                <div className="sm:col-span-5 flex flex-col items-center">
                  <div className="relative w-28 h-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={attendancePieData}
                          innerRadius={34}
                          outerRadius={46}
                          dataKey="value"
                        >
                          {attendancePieData.map((e, idx) => (
                            <Cell key={`att-${idx}`} fill={e.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-extrabold text-white">84%</span>
                      <span className="text-[9px] text-slate-400">Present</span>
                    </div>
                  </div>

                  <div className="flex gap-2 text-[10px] mt-2">
                    <span className="text-emerald-400 font-bold">834 Present</span>
                    <span className="text-rose-400 font-bold">127 Absent</span>
                    <span className="text-amber-400 font-bold">42 Late</span>
                  </div>
                </div>

                {/* Hourly Bar Chart (7 cols) */}
                <div className="sm:col-span-7 h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attendanceHourlyData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" />
                      <XAxis dataKey="time" stroke="#64748b" fontSize={9} />
                      <YAxis stroke="#64748b" fontSize={9} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '10px' }} />
                      <Bar dataKey="present" fill="#10b981" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="absent" fill="#f43f5e" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Upcoming Membership Expiry (5 Cols) */}
            <div className="md:col-span-5 p-5 rounded-2xl bg-slate-900/90 border border-slate-700/70 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Upcoming Expiry
                </h3>
                <button
                  onClick={() => onNavigate('memberships')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                >
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                {[
                  { name: 'Meena Sharma', plan: '6 Months', date: '06 May 2025', days: '7 Days Left', color: 'rose' },
                  { name: 'Vikash Kumar', plan: '3 Months', date: '12 May 2025', days: '14 Days Left', color: 'amber' },
                  { name: 'Anjali Singh', plan: '1 Year', date: '20 May 2025', days: '22 Days Left', color: 'yellow' },
                  { name: 'Rohit Yadav', plan: '6 Months', date: '28 May 2025', days: '30 Days Left', color: 'blue' },
                  { name: 'Priya Desai', plan: '3 Months', date: '02 Jun 2025', days: '35 Days Left', color: 'emerald' },
                ].map((st, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 hover:bg-slate-800/60 transition">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-mono">{i + 1}</span>
                      <div>
                        <span className="text-xs font-bold text-white block">{st.name}</span>
                        <span className="text-[10px] text-slate-400">{st.plan} • {st.date}</span>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        st.color === 'rose'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : st.color === 'amber'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : st.color === 'yellow'
                          ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {st.days}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right 3-4 Columns: Intelligence Sidebar (Exact Match to Image 3) */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-5">
          {/* Notifications Card */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700/70 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-cyan-400" />
                Notifications
              </h3>
              <button
                onClick={() => onNavigate('notifications')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {db.notifications.slice(0, 5).map(notif => (
                <div key={notif.id} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-cyan-500/30 transition">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-white leading-tight">{notif.title}</span>
                    <span className="text-[10px] text-slate-500 shrink-0 ml-1">{notif.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">{notif.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Activities Timeline (with vertical connecting line) */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700/70 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                Today's Activities
              </h3>
              <button
                onClick={() => onNavigate('activity-timeline')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
              >
                View All
              </button>
            </div>

            {/* Vertical timeline */}
            <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {[
                { time: '10:15 AM', title: 'Check-in (STU-1024)', desc: 'Amit Kumar — Seat A12', color: 'emerald' },
                { time: '09:50 AM', title: 'New Admission (ADM-2025-015)', desc: 'Pooja Sharma', color: 'blue' },
                { time: '09:30 AM', title: 'Payment (TXN-78456)', desc: '₹ 1,500 — Cash', color: 'amber' },
                { time: '09:10 AM', title: 'Seat Transfer (TRF-003)', desc: 'Rohit Singh — A23 to B12', color: 'teal' },
                { time: '08:45 AM', title: 'Visitor Check-in', desc: 'Mr. Suresh — Meeting', color: 'purple' },
              ].map((act, i) => (
                <div key={i} className="relative">
                  {/* Node point */}
                  <div
                    className={`absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                      act.color === 'emerald'
                        ? 'bg-emerald-400'
                        : act.color === 'blue'
                        ? 'bg-blue-400'
                        : act.color === 'amber'
                        ? 'bg-amber-400'
                        : act.color === 'teal'
                        ? 'bg-teal-400'
                        : 'bg-purple-400'
                    }`}
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-cyan-400 font-semibold">{act.time}</span>
                    <span className="text-xs font-bold text-white">{act.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{act.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions (Matching Image 3: 6 Colorful Pills) */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700/70 shadow-xl space-y-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Quick Actions
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => onNavigate('new-admission')}
                className="p-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 flex flex-col items-center justify-center gap-1.5 transition text-center"
              >
                <UserPlus className="w-4 h-4" />
                New Admission
              </button>

              <button
                onClick={() => onNavigate('student-add-edit')}
                className="p-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 flex flex-col items-center justify-center gap-1.5 transition text-center"
              >
                <Users className="w-4 h-4" />
                Add Student
              </button>

              <button
                onClick={() => onNavigate('collect-payment')}
                className="p-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 flex flex-col items-center justify-center gap-1.5 transition text-center"
              >
                <CreditCard className="w-4 h-4" />
                Collect Payment
              </button>

              <button
                onClick={onOpenQRScanner}
                className="p-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold shadow-lg shadow-amber-600/20 flex flex-col items-center justify-center gap-1.5 transition text-center"
              >
                <CheckSquare className="w-4 h-4" />
                Attendance
              </button>

              <button
                onClick={() => onNavigate('seats')}
                className="p-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 flex flex-col items-center justify-center gap-1.5 transition text-center"
              >
                <Armchair className="w-4 h-4" />
                Seat Matrix
              </button>

              <button
                onClick={() => onNavigate('reservations')}
                className="p-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-bold shadow-lg shadow-pink-600/20 flex flex-col items-center justify-center gap-1.5 transition text-center"
              >
                <Clock className="w-4 h-4" />
                Reservation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
