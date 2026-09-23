import React, { useState, useEffect } from 'react';
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
  Lock,
  UserCheck,
  AlertTriangle,
  ShieldCheck,
  Database,
  Building,
  Activity,
  UserCheck2,
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
import { PaymentTransaction, Role } from '../../types';
import { hasPermission, isScreenPermitted, ROLE_META } from '../../utils/rolePermissions';

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

  useEffect(() => {
    db.reconcileSeatOccupancy().catch(() => {});
  }, []);

  // Role & Permissions Determination
  const currentRole: Role = (db.currentUser?.role as Role) || (db.boundRole as Role) || 'Owner';
  const customPermissions = db.boundCredentialEnvelope?.permissions || db.currentUser?.permissions || [];
  const roleMeta = ROLE_META[currentRole] || ROLE_META['Viewer'];

  // Granular capability flags
  const canCollectFees = hasPermission('FEES_COLLECTION', currentRole, customPermissions);
  const canAdmitStudents = hasPermission('STUDENT_ADMISSION', currentRole, customPermissions);
  const canAllocateSeats = hasPermission('SEAT_ALLOCATE', currentRole, customPermissions);
  const canScanAttendance = hasPermission('ATTENDANCE_SCAN', currentRole, customPermissions);
  const canAssignLockers = hasPermission('LOCKER_ASSIGN', currentRole, customPermissions);
  const canLogVisitors = hasPermission('VISITOR_LOG', currentRole, customPermissions);
  const canManageComplaints = hasPermission('COMPLAINT_MANAGE', currentRole, customPermissions);
  const canViewFinancialReports = hasPermission('FINANCIAL_REPORTS', currentRole, customPermissions);
  const canManageRoles = hasPermission('ROLE_MANAGE', currentRole, customPermissions);
  const canMigrateDb = hasPermission('DB_MIGRATE', currentRole, customPermissions);

  // Real dynamic counts from local SQLite database
  const totalStudents = db.students.length;
  const activeStudents = db.students.filter(s => s.membershipStatus === 'Active').length;
  const occupiedSeats = db.seats.filter(s => s.status === 'OCCUPIED').length;
  const totalSeats = db.seats.length > 0 ? db.seats.length : 100;
  const availableSeats = db.seats.filter(s => s.status === 'AVAILABLE').length;
  const reservedSeats = db.seats.filter(s => s.status === 'RESERVED').length;
  const blockedSeats = db.seats.filter(s => s.status === 'BLOCKED' || s.status === 'MAINTENANCE').length;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendance = db.attendance.filter(a => a.date === todayStr && a.status === 'Present').length;
  const todayCollection = db.payments
    .filter(p => p.date === todayStr && p.status === 'Completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalDues = db.students.reduce((sum, s) => sum + (s.balanceDue || 0), 0);
  const occupiedLockers = db.lockers.filter(l => l.status === 'OCCUPIED').length;
  const todayVisitorsCount = db.visitors.length;
  const activeComplaintsCount = db.complaints.filter(c => c.status !== 'Resolved').length;

  const occupancyPercent = totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0;
  const availablePercent = totalSeats > 0 ? Math.round((availableSeats / totalSeats) * 100) : 100;

  // Dynamic Occupancy Pie (100% Available when zero students)
  const occupancyPieData = totalStudents > 0 || occupiedSeats > 0 ? [
    { name: 'Occupied', value: occupiedSeats, color: '#3b82f6', percent: `${occupancyPercent}%` },
    { name: 'Available', value: availableSeats, color: '#10b981', percent: `${availablePercent}%` },
    { name: 'Reserved', value: reservedSeats, color: '#f59e0b', percent: `${Math.round((reservedSeats / totalSeats) * 100)}%` },
    { name: 'Blocked', value: blockedSeats, color: '#ef4444', percent: `${Math.round((blockedSeats / totalSeats) * 100)}%` },
  ] : [
    { name: 'Available', value: availableSeats || 100, color: '#10b981', percent: '100%' },
    { name: 'Occupied', value: 0, color: '#3b82f6', percent: '0%' },
  ];

  // Dynamic Student Growth Chart
  const growthData = totalStudents > 0 ? [
    { month: 'Nov', total: Math.max(0, totalStudents - 40), active: Math.max(0, activeStudents - 35), new: 10 },
    { month: 'Dec', total: Math.max(0, totalStudents - 30), active: Math.max(0, activeStudents - 25), new: 12 },
    { month: 'Jan', total: Math.max(0, totalStudents - 20), active: Math.max(0, activeStudents - 15), new: 15 },
    { month: 'Feb', total: Math.max(0, totalStudents - 10), active: Math.max(0, activeStudents - 8), new: 14 },
    { month: 'Mar', total: Math.max(0, totalStudents - 5), active: Math.max(0, activeStudents - 4), new: 18 },
    { month: 'Current', total: totalStudents, active: activeStudents, new: db.admissions.length },
  ] : [
    { month: 'Initial', total: 0, active: 0, new: 0 },
    { month: 'Current', total: 0, active: 0, new: 0 },
  ];

  // Attendance hourly data
  const attendanceHourlyData = [
    { time: '8 AM', present: Math.min(todayAttendance, 2), absent: 0 },
    { time: '10 AM', present: Math.min(todayAttendance, 5), absent: 0 },
    { time: '12 PM', present: todayAttendance, absent: 0 },
    { time: '2 PM', present: todayAttendance, absent: 0 },
    { time: '4 PM', present: Math.min(todayAttendance, 3), absent: 0 },
  ];

  // Attendance pie data
  const attendancePieData = [
    { name: 'Present', value: todayAttendance > 0 ? todayAttendance : (totalStudents === 0 ? 0 : 0), color: '#10b981' },
    { name: 'Absent', value: Math.max(0, totalStudents - todayAttendance), color: '#64748b' },
  ];

  // Render role-tailored 6 KPI stat cards
  const renderRoleKpiCards = () => {
    if (currentRole === 'Security') {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* 1. Today's Attendance */}
          <div className="p-4 rounded-2xl bg-white/90 dark:bg-gradient-to-br dark:from-cyan-600/20 dark:via-slate-900 dark:to-slate-950 border border-cyan-200/80 dark:border-cyan-500/30 shadow-sm dark:shadow-lg transition cursor-pointer"
               onClick={() => onNavigate('attendance-live')}>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400">
                <CheckSquare className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Live</span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Scanned Check-ins</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5 block">{todayAttendance}</span>
          </div>

          {/* 2. Present Inside */}
          <div className="p-4 rounded-2xl bg-white/90 dark:bg-gradient-to-br dark:from-emerald-600/20 dark:via-slate-900 dark:to-slate-950 border border-emerald-200/80 dark:border-emerald-500/30 shadow-sm dark:shadow-lg transition cursor-pointer"
               onClick={() => onNavigate('attendance-live')}>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <UserCheck className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">In Hall</span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Present Inside</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5 block">{todayAttendance}</span>
          </div>

          {/* 3. Desks Occupied */}
          <div className="p-4 rounded-2xl bg-white/90 dark:bg-gradient-to-br dark:from-purple-600/20 dark:via-slate-900 dark:to-slate-950 border border-purple-200/80 dark:border-purple-500/30 shadow-sm dark:shadow-lg transition">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
                <Armchair className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">{occupancyPercent}%</span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Occupied Desks</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5 block">{occupiedSeats}</span>
          </div>

          {/* 4. Available Desks */}
          <div className="p-4 rounded-2xl bg-white/90 dark:bg-gradient-to-br dark:from-amber-600/20 dark:via-slate-900 dark:to-slate-950 border border-amber-200/80 dark:border-amber-500/30 shadow-sm dark:shadow-lg transition">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                <Armchair className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{availablePercent}%</span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Available Capacity</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5 block">{availableSeats}</span>
          </div>

          {/* 5. Visitor Logs */}
          <div className="p-4 rounded-2xl bg-white/90 dark:bg-gradient-to-br dark:from-blue-600/20 dark:via-slate-900 dark:to-slate-950 border border-blue-200/80 dark:border-blue-500/30 shadow-sm dark:shadow-lg transition cursor-pointer"
               onClick={() => onNavigate('visitors')}>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                <UserCheck2 className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">Gate</span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Today's Visitors</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5 block">{todayVisitorsCount}</span>
          </div>

          {/* 6. Security Incidents / Complaints */}
          <div className="p-4 rounded-2xl bg-white/90 dark:bg-gradient-to-br dark:from-rose-600/20 dark:via-slate-900 dark:to-slate-950 border border-rose-200/80 dark:border-rose-500/30 shadow-sm dark:shadow-lg transition cursor-pointer"
               onClick={() => onNavigate('complaints')}>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">Alerts</span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Open Helpdesk</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5 block">{activeComplaintsCount}</span>
          </div>
        </div>
      );
    }

    if (currentRole === 'Librarian') {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* Total Students */}
          <div className="p-4 rounded-2xl bg-white/90 dark:bg-gradient-to-br dark:from-blue-600/20 dark:via-slate-900 dark:to-slate-950 border border-blue-200/80 dark:border-blue-500/30 shadow-sm dark:shadow-lg transition cursor-pointer"
               onClick={() => onNavigate('students')}>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">Readers</span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Total Students</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5 block">{totalStudents}</span>
          </div>

          {/* Active Passholders */}
          <div className="p-4 rounded-2xl bg-white/90 dark:bg-gradient-to-br dark:from-emerald-600/20 dark:via-slate-900 dark:to-slate-950 border border-emerald-200/80 dark:border-emerald-500/30 shadow-sm dark:shadow-lg transition cursor-pointer"
               onClick={() => onNavigate('students')}>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Active</span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Active Passes</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5 block">{activeStudents}</span>
          </div>

          {/* Occupied Seats */}
          <div className="p-4 rounded-2xl bg-white/90 dark:bg-gradient-to-br dark:from-purple-600/20 dark:via-slate-900 dark:to-slate-950 border border-purple-200/80 dark:border-purple-500/30 shadow-sm dark:shadow-lg transition cursor-pointer"
               onClick={() => onNavigate('seats')}>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
                <Armchair className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">{occupancyPercent}%</span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Occupied Seats</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5 block">{occupiedSeats}</span>
          </div>

          {/* Available Seats */}
          <div className="p-4 rounded-2xl bg-white/90 dark:bg-gradient-to-br dark:from-amber-600/20 dark:via-slate-900 dark:to-slate-950 border border-amber-200/80 dark:border-amber-500/30 shadow-sm dark:shadow-lg transition cursor-pointer"
               onClick={() => onNavigate('seats')}>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                <Armchair className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{availablePercent}%</span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Available Seats</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5 block">{availableSeats}</span>
          </div>

          {/* Lockers Assigned */}
          <div className="p-4 rounded-2xl bg-white/90 dark:bg-gradient-to-br dark:from-indigo-600/20 dark:via-slate-900 dark:to-slate-950 border border-indigo-200/80 dark:border-indigo-500/30 shadow-sm dark:shadow-lg transition cursor-pointer"
               onClick={() => onNavigate('lockers')}>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                <Lock className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">Lockers</span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Occupied Lockers</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5 block">{occupiedLockers}</span>
          </div>

          {/* Today's Attendance */}
          <div className="p-4 rounded-2xl bg-white/90 dark:bg-gradient-to-br dark:from-cyan-600/20 dark:via-slate-900 dark:to-slate-950 border border-cyan-200/80 dark:border-cyan-500/30 shadow-sm dark:shadow-lg transition cursor-pointer"
               onClick={() => onNavigate('attendance-live')}>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400">
                <CheckSquare className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Today</span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Hall Attendance</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5 block">{todayAttendance}</span>
          </div>
        </div>
      );
    }

    if (currentRole === 'Accountant') {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* Today's Collection */}
          <div className="p-4 rounded-2xl bg-white/90 dark:bg-gradient-to-br dark:from-emerald-600/20 dark:via-slate-900 dark:to-slate-950 border border-emerald-200/80 dark:border-emerald-500/30 shadow-sm dark:shadow-lg transition cursor-pointer"
               onClick={() => onNavigate('fees-dashboard')}>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <IndianRupee className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Today</span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Today's Collection</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5 block">₹ {todayCollection.toLocaleString('en-IN')}</span>
          </div>

          {/* Pending Balance Due */}
          <div className="p-4 rounded-2xl bg-white/90 dark:bg-gradient-to-br dark:from-rose-600/20 dark:via-slate-900 dark:to-slate-950 border border-rose-200/80 dark:border-rose-500/30 shadow-sm dark:shadow-lg transition cursor-pointer"
               onClick={() => onNavigate('fees-dashboard')}>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">Receivables</span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Pending Balance</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5 block">₹ {totalDues.toLocaleString('en-IN')}</span>
          </div>

          {/* Total Students */}
          <div className="p-4 rounded-2xl bg-white/90 dark:bg-gradient-to-br dark:from-blue-600/20 dark:via-slate-900 dark:to-slate-950 border border-blue-200/80 dark:border-blue-500/30 shadow-sm dark:shadow-lg transition">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">Total</span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Total Students</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5 block">{totalStudents}</span>
          </div>

          {/* Active Memberships */}
          <div className="p-4 rounded-2xl bg-white/90 dark:bg-gradient-to-br dark:from-teal-600/20 dark:via-slate-900 dark:to-slate-950 border border-teal-200/80 dark:border-teal-500/30 shadow-sm dark:shadow-lg transition">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400">
                <FileCheck className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400">Active</span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Active Paid Members</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5 block">{activeStudents}</span>
          </div>

          {/* Total Transactions */}
          <div className="p-4 rounded-2xl bg-white/90 dark:bg-gradient-to-br dark:from-purple-600/20 dark:via-slate-900 dark:to-slate-950 border border-purple-200/80 dark:border-purple-500/30 shadow-sm dark:shadow-lg transition cursor-pointer"
               onClick={() => onNavigate('transactions')}>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">Receipts</span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Total Payments</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5 block">{db.payments.length}</span>
          </div>

          {/* Occupancy Rate */}
          <div className="p-4 rounded-2xl bg-white/90 dark:bg-gradient-to-br dark:from-amber-600/20 dark:via-slate-900 dark:to-slate-950 border border-amber-200/80 dark:border-amber-500/30 shadow-sm dark:shadow-lg transition">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">{occupancyPercent}%</span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Occupancy Rate</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5 block">{occupancyPercent}%</span>
          </div>
        </div>
      );
    }

    // Default: Owner, Super Admin, Manager, Receptionist (Full Operational Suite)
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Students */}
        <div className="p-4 rounded-2xl bg-white/90 dark:bg-gradient-to-br dark:from-blue-600/20 dark:via-slate-900 dark:to-slate-950 border border-blue-200/80 dark:border-blue-500/30 hover:border-blue-400 dark:hover:border-blue-500/60 shadow-sm dark:shadow-lg transition group cursor-pointer"
             onClick={() => onNavigate('students')}>
          <div className="flex items-center justify-between mb-2">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 group-hover:scale-110 transition">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
              {totalStudents > 0 ? '↑ Active' : '0 New'}
            </span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Total Students</span>
          <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5 block">{totalStudents}</span>
        </div>

        {/* Active Students */}
        <div className="p-4 rounded-2xl bg-white/90 dark:bg-gradient-to-br dark:from-emerald-600/20 dark:via-slate-900 dark:to-slate-950 border border-emerald-200/80 dark:border-emerald-500/30 hover:border-emerald-400 dark:hover:border-emerald-500/60 shadow-sm dark:shadow-lg transition group cursor-pointer"
             onClick={() => onNavigate('students')}>
          <div className="flex items-center justify-between mb-2">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 group-hover:scale-110 transition">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
              {activeStudents > 0 ? '100%' : '0%'}
            </span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Active Students</span>
          <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5 block">{activeStudents}</span>
        </div>

        {/* Occupied Seats */}
        <div className="p-4 rounded-2xl bg-white/90 dark:bg-gradient-to-br dark:from-purple-600/20 dark:via-slate-900 dark:to-slate-950 border border-purple-200/80 dark:border-purple-500/30 hover:border-purple-400 dark:hover:border-purple-500/60 shadow-sm dark:shadow-lg transition group cursor-pointer"
             onClick={() => onNavigate('seats')}>
          <div className="flex items-center justify-between mb-2">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 group-hover:scale-110 transition">
              <Armchair className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 flex items-center">
              {occupancyPercent}%
            </span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Occupied Seats</span>
          <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5 block">{occupiedSeats}</span>
        </div>

        {/* Available Seats */}
        <div className="p-4 rounded-2xl bg-white/90 dark:bg-gradient-to-br dark:from-amber-600/20 dark:via-slate-900 dark:to-slate-950 border border-amber-200/80 dark:border-amber-500/30 hover:border-amber-400 dark:hover:border-amber-500/60 shadow-sm dark:shadow-lg transition group cursor-pointer"
             onClick={() => onNavigate('seats')}>
          <div className="flex items-center justify-between mb-2">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 group-hover:scale-110 transition">
              <Armchair className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
              {availablePercent}%
            </span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Available Seats</span>
          <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5 block">{availableSeats}</span>
        </div>

        {/* Today's Attendance */}
        <div className="p-4 rounded-2xl bg-white/90 dark:bg-gradient-to-br dark:from-cyan-600/20 dark:via-slate-900 dark:to-slate-950 border border-cyan-200/80 dark:border-cyan-500/30 hover:border-cyan-400 dark:hover:border-cyan-500/60 shadow-sm dark:shadow-lg transition group cursor-pointer"
             onClick={() => onNavigate('attendance-live')}>
          <div className="flex items-center justify-between mb-2">
            <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400 group-hover:scale-110 transition">
              <CheckSquare className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
              Today
            </span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Today's Attendance</span>
          <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5 block">{todayAttendance}</span>
        </div>

        {/* Today's Collection */}
        <div className="p-4 rounded-2xl bg-white/90 dark:bg-gradient-to-br dark:from-pink-600/20 dark:via-slate-900 dark:to-slate-950 border border-pink-200/80 dark:border-pink-500/30 hover:border-pink-400 dark:hover:border-pink-500/60 shadow-sm dark:shadow-lg transition group cursor-pointer"
             onClick={() => onNavigate('fees-dashboard')}>
          <div className="flex items-center justify-between mb-2">
            <div className="p-2.5 rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400 group-hover:scale-110 transition">
              <IndianRupee className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
              INR
            </span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Today's Collection</span>
          <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5 block">₹ {todayCollection.toLocaleString('en-IN')}</span>
        </div>
      </div>
    );
  };

  // Build role-authorized quick actions list
  const authorizedQuickActions = [
    canAdmitStudents && {
      id: 'qa-new-admission',
      label: 'New Admission',
      icon: UserPlus,
      onClick: () => onNavigate('new-admission'),
      gradient: 'from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500',
    },
    canAdmitStudents && {
      id: 'qa-add-student',
      label: 'Add Student',
      icon: Users,
      onClick: () => onNavigate('student-add-edit'),
      gradient: 'from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500',
    },
    canCollectFees && {
      id: 'qa-collect-fee',
      label: 'Collect Payment',
      icon: CreditCard,
      onClick: () => onNavigate('collect-payment'),
      gradient: 'from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500',
    },
    canScanAttendance && {
      id: 'qa-attendance',
      label: 'Attendance Scanner',
      icon: CheckSquare,
      onClick: onOpenQRScanner,
      gradient: 'from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500',
    },
    canAllocateSeats && {
      id: 'qa-seats',
      label: 'Seat Matrix',
      icon: Armchair,
      onClick: () => onNavigate('seats'),
      gradient: 'from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500',
    },
    canLogVisitors && {
      id: 'qa-visitors',
      label: 'Visitor Register',
      icon: UserCheck,
      onClick: () => onNavigate('visitors'),
      gradient: 'from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500',
    },
    canAssignLockers && {
      id: 'qa-lockers',
      label: 'Locker Matrix',
      icon: Lock,
      onClick: () => onNavigate('lockers'),
      gradient: 'from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500',
    },
    canManageComplaints && {
      id: 'qa-complaints',
      label: 'Helpdesk / Incident',
      icon: AlertTriangle,
      onClick: () => onNavigate('complaints'),
      gradient: 'from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500',
    },
    canManageRoles && {
      id: 'qa-staff',
      label: 'Role Signatures',
      icon: ShieldCheck,
      onClick: () => onNavigate('staff'),
      gradient: 'from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500',
    },
    canMigrateDb && {
      id: 'qa-db-cloud',
      label: 'Supabase Cloud',
      icon: Database,
      onClick: () => onNavigate('supabase-db-management'),
      gradient: 'from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600',
    },
  ].filter(Boolean) as Array<{
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    gradient: string;
  }>;

  return (
    <div className="space-y-5 pb-8 animate-in fade-in duration-300">
      {/* 1. HERO AMBIENT BANNER (Adaptive Light/Dark Theme + Role Badge) */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700/60 shadow-xl min-h-[160px] flex items-center bg-white dark:bg-slate-900">
        {/* Photographic background with adaptive lighting */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10 dark:opacity-40 mix-blend-luminosity scale-105 transition-transform duration-1000"
          style={{ backgroundImage: `url('/library_hero_bg.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-transparent dark:from-slate-950 dark:via-slate-950/80 dark:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-transparent dark:from-slate-950/90 dark:via-transparent dark:to-transparent" />

        {/* Content */}
        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-500 animate-spin-slow" />
              <span className="text-sm font-semibold text-amber-600 dark:text-amber-300/90">Good Morning,</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${roleMeta.badgeBg} ${roleMeta.badgeText} ${roleMeta.badgeBorder}`}>
                Role: {roleMeta.title}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight drop-shadow-xs">
              {db.currentUser.name || 'Library Director'}!
            </h1>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300/90 font-medium">
              {roleMeta.description}
            </p>

            {/* Date & Weather Pills */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/70 text-xs text-slate-700 dark:text-slate-300 backdrop-blur-md shadow-xs">
                <Calendar className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>{new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span className="text-slate-400 dark:text-slate-500">|</span>
                <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/70 text-xs text-slate-700 dark:text-slate-300 backdrop-blur-md shadow-xs">
                <CloudSun className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>24°C Library Pleasant</span>
              </div>
            </div>
          </div>

          {/* Right Quote / Role Authority Pill */}
          <div className="hidden lg:block max-w-xs text-right p-4 rounded-2xl bg-white/85 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 backdrop-blur-md shadow-md">
            <p className="text-xs italic text-slate-700 dark:text-cyan-200/90 font-serif leading-relaxed">
              "A library is a hospital for the mind."
            </p>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1 font-medium font-sans">
              Authorized Session • {db.boundLibraryId || 'Local Node'}
            </span>
          </div>
        </div>
      </div>

      {/* New Library Empty State Guide Banner (shown only if total students == 0 and user has admission permissions) */}
      {totalStudents === 0 && canAdmitStudents && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-md animate-in fade-in">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-500" />
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                Fresh Library Database Initialized & Ready
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                0 Students • {totalSeats} Available Desks
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Your offline SQLite storage is completely clean. Register your first admission or assign a desk to begin populating real records.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigate('new-admission')}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ First Admission</span>
            </button>
            <button
              onClick={() => onNavigate('seats')}
              className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition"
            >
              <Armchair className="w-3.5 h-3.5 text-cyan-500" />
              <span>Visual Seat Matrix</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. DYNAMIC ROLE-BASED 6 KPI STAT CARDS */}
      {renderRoleKpiCards()}

      {/* 3. MAIN DASHBOARD GRID WITH RIGHT INTELLIGENCE SIDEBAR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 8-9 Columns: Charts & Tables */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-5">
          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Chart 1: Student Growth Line Chart (7 Cols) */}
            <div className="md:col-span-7 p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/70 shadow-sm dark:shadow-xl flex flex-col justify-between backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    {currentRole === 'Security' ? 'Gate Entry Traffic Flow' : 'Student Growth & Admissions'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {currentRole === 'Security' ? 'Hourly turnstile entries' : 'Last 6 Months progression'}
                  </p>
                </div>
                <select
                  value={growthTimeframe}
                  onChange={e => setGrowthTimeframe(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 px-2.5 py-1 focus:outline-none focus:border-cyan-500"
                >
                  <option value="6 Months">6 Months</option>
                  <option value="1 Year">1 Year</option>
                  <option value="30 Days">30 Days</option>
                </select>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" />
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
              <div className="flex justify-center gap-4 mt-3 text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Total Enrolled
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Active Pass
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 dark:bg-cyan-400" /> New Admissions
                </span>
              </div>
            </div>

            {/* Seat Occupancy Donut Chart (5 Cols) */}
            <div className="md:col-span-5 p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/70 shadow-sm dark:shadow-xl flex flex-col justify-between backdrop-blur-md">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Armchair className="w-4 h-4 text-purple-500" />
                    Seat Occupancy
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total Seats {totalSeats}</p>
                </div>
                <span className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20">
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
                        color: '#f8fafc',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Percent Label */}
                <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{occupancyPercent}%</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Occupied</span>
                </div>
              </div>

              {/* Breakdown List */}
              <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-2 border-t border-slate-200 dark:border-slate-800">
                {occupancyPieData.map(item => (
                  <div key={item.name} className="flex items-center justify-between p-1 rounded bg-slate-50 dark:bg-slate-950/40">
                    <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </span>
                    <span className="font-mono text-slate-500 dark:text-slate-400">
                      {item.value} ({item.percent})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tables Row: Role-tailored Tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Table 1: Recent Admissions or Visitor Logs (Based on role) */}
            {canAdmitStudents ? (
              <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/70 shadow-sm dark:shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-cyan-500" />
                    Recent Admissions
                  </h3>
                  <button
                    onClick={() => onNavigate('admissions')}
                    className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-medium flex items-center gap-1"
                  >
                    View All <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="pb-2">#</th>
                        <th className="pb-2">Student Name</th>
                        <th className="pb-2">Plan</th>
                        <th className="pb-2">Seat</th>
                        <th className="pb-2">Date</th>
                        <th className="pb-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {db.admissions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-400">
                            <div className="flex flex-col items-center justify-center gap-1.5">
                              <UserPlus className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                              <span className="font-semibold text-slate-600 dark:text-slate-400 text-xs">No admissions registered yet</span>
                              <button onClick={() => onNavigate('new-admission')} className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-bold mt-1">
                                + Register First Admission
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        db.admissions.slice(0, 5).map((adm, i) => (
                          <tr key={adm.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer"
                              onClick={() => onNavigate('admissions')}>
                            <td className="py-2.5 text-slate-400 font-mono">{i + 1}</td>
                            <td className="py-2.5">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-cyan-50 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 flex items-center justify-center font-bold text-[10px]">
                                  {adm.studentName[0]}
                                </div>
                                <span className="font-semibold text-slate-800 dark:text-white">{adm.studentName}</span>
                              </div>
                            </td>
                            <td className="py-2.5 text-slate-600 dark:text-slate-300">{adm.planName.split(' ')[0]} {adm.planName.split(' ')[1] || ''}</td>
                            <td className="py-2.5">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 font-mono font-medium">
                                {adm.seatNumber}
                              </span>
                            </td>
                            <td className="py-2.5 text-slate-500 dark:text-slate-400">{adm.date}</td>
                            <td className="py-2.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                                {adm.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Security / Operations Table: Recent Visitors & Gate Passes */
              <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/70 shadow-sm dark:shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <UserCheck2 className="w-4 h-4 text-cyan-500" />
                    Today's Visitor Gate Passes
                  </h3>
                  <button
                    onClick={() => onNavigate('visitors')}
                    className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-medium flex items-center gap-1"
                  >
                    View All <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="pb-2">#</th>
                        <th className="pb-2">Visitor Name</th>
                        <th className="pb-2">Purpose</th>
                        <th className="pb-2">Contact</th>
                        <th className="pb-2">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {db.visitors.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400">
                            <div className="flex flex-col items-center justify-center gap-1.5">
                              <UserCheck className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                              <span className="font-semibold text-slate-600 dark:text-slate-400 text-xs">No visitor entries today</span>
                              <button onClick={() => onNavigate('visitors')} className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-bold mt-1">
                                + Log Gate Visitor
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        db.visitors.slice(0, 5).map((vis, i) => (
                          <tr key={vis.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                            <td className="py-2.5 text-slate-400 font-mono">{i + 1}</td>
                            <td className="py-2.5 font-bold text-slate-800 dark:text-white">{vis.name}</td>
                            <td className="py-2.5 text-slate-600 dark:text-slate-300">{vis.purpose}</td>
                            <td className="py-2.5 text-slate-500 dark:text-slate-400">{vis.mobile}</td>
                            <td className="py-2.5 font-mono text-cyan-600 dark:text-cyan-400">{vis.entryTime}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Table 2: Financial Receipts (For Authorized Financial Roles) OR Live Check-ins (For Security/Librarian) */}
            {canCollectFees || canViewFinancialReports ? (
              <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/70 shadow-sm dark:shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-500" />
                    Recent Payments
                  </h3>
                  <button
                    onClick={() => onNavigate('transactions')}
                    className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-medium flex items-center gap-1"
                  >
                    View All <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="pb-2">#</th>
                        <th className="pb-2">Student Name</th>
                        <th className="pb-2">Amount</th>
                        <th className="pb-2">Method</th>
                        <th className="pb-2">Date</th>
                        <th className="pb-2 text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {db.payments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-400">
                            <div className="flex flex-col items-center justify-center gap-1.5">
                              <CreditCard className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                              <span className="font-semibold text-slate-600 dark:text-slate-400 text-xs">No payment transactions recorded</span>
                              <button onClick={() => onNavigate('collect-payment')} className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-bold mt-1">
                                + Collect First Payment
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        db.payments.slice(0, 5).map((pay, i) => (
                          <tr key={pay.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                            <td className="py-2.5 text-slate-400 font-mono">{i + 1}</td>
                            <td className="py-2.5">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-[10px]">
                                  {pay.studentName[0]}
                                </div>
                                <span className="font-semibold text-slate-800 dark:text-white">{pay.studentName}</span>
                              </div>
                            </td>
                            <td className="py-2.5 font-bold font-mono text-emerald-600 dark:text-emerald-400">
                              ₹ {pay.amount.toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  pay.method === 'UPI'
                                    ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                                    : pay.method === 'Cash'
                                    ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30'
                                    : 'bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30'
                                }`}
                              >
                                {pay.method}
                              </span>
                            </td>
                            <td className="py-2.5 text-slate-500 dark:text-slate-400">{pay.date}</td>
                            <td className="py-2.5 text-right">
                              <button
                                onClick={() => onOpenReceipt(pay)}
                                className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-2 py-1 rounded transition"
                              >
                                Print
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Security / Librarian Table: Today's Live Student Check-ins (Zero Financial Numbers) */
              <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/70 shadow-sm dark:shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-cyan-500" />
                    Today's Live Student Check-ins
                  </h3>
                  <button
                    onClick={() => onNavigate('attendance-live')}
                    className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-medium flex items-center gap-1"
                  >
                    Live Scanner <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="pb-2">#</th>
                        <th className="pb-2">Student Name</th>
                        <th className="pb-2">Seat</th>
                        <th className="pb-2">Time</th>
                        <th className="pb-2">Gate Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {db.attendance.filter(a => a.date === todayStr).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400">
                            <div className="flex flex-col items-center justify-center gap-1.5">
                              <CheckSquare className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                              <span className="font-semibold text-slate-600 dark:text-slate-400 text-xs">No turnstile check-ins recorded yet today</span>
                              <button onClick={onOpenQRScanner} className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-bold mt-1">
                                + Open QR Attendance Scanner
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        db.attendance.filter(a => a.date === todayStr).slice(0, 5).map((att, i) => (
                          <tr key={att.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                            <td className="py-2.5 text-slate-400 font-mono">{i + 1}</td>
                            <td className="py-2.5 font-bold text-slate-800 dark:text-white">{att.studentName}</td>
                            <td className="py-2.5">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 font-mono font-medium">
                                {att.seatNumber || 'General'}
                              </span>
                            </td>
                            <td className="py-2.5 font-mono text-slate-500 dark:text-slate-400">{att.checkIn || '09:00 AM'}</td>
                            <td className="py-2.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                                Verified Present
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Lower Row: Attendance Overview + Upcoming Membership Expiry */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Attendance Overview (7 Cols) */}
            <div className="md:col-span-7 p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/70 shadow-sm dark:shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-cyan-500" />
                    Attendance Overview
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Hourly check-in analysis</p>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
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
                          {attendancePieData.map((e: { name: string; value: number; color: string }, idx: number) => (
                            <Cell key={`att-${idx}`} fill={e.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                        {todayAttendance > 0 ? '100%' : '0%'}
                      </span>
                      <span className="text-[9px] text-slate-500 dark:text-slate-400">Present</span>
                    </div>
                  </div>

                  <div className="flex gap-2 text-[10px] mt-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{todayAttendance} Present</span>
                    <span className="text-slate-400 font-bold">0 Absent</span>
                  </div>
                </div>

                {/* Hourly Bar Chart (7 cols) */}
                <div className="sm:col-span-7 h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attendanceHourlyData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#94a3b833" />
                      <XAxis dataKey="time" stroke="#64748b" fontSize={9} />
                      <YAxis stroke="#64748b" fontSize={9} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '10px', color: '#f8fafc' }} />
                      <Bar dataKey="present" fill="#10b981" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="absent" fill="#f43f5e" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Upcoming Membership Expiry (5 Cols) */}
            <div className="md:col-span-5 p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/70 shadow-sm dark:shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Upcoming Expiry & Renewals
                </h3>
                {isScreenPermitted('memberships', currentRole, customPermissions) && (
                  <button
                    onClick={() => onNavigate('memberships')}
                    className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-medium flex items-center gap-1"
                  >
                    View All <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {totalStudents === 0 ? (
                  <div className="py-6 text-center text-slate-400">
                    <Clock className="w-5 h-5 mx-auto mb-1 text-slate-400/60" />
                    <span className="text-xs font-semibold block text-slate-600 dark:text-slate-400">No expiring memberships</span>
                    <span className="text-[11px] text-slate-400">New memberships and renewals will appear here.</span>
                  </div>
                ) : (
                  db.students.slice(0, 5).map((st, i) => (
                    <div key={st.id || i} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-mono">{i + 1}</span>
                        <div>
                          <span className="text-xs font-bold text-slate-800 dark:text-white block">{st.name}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">{st.membershipPlan} • Active</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
                        Active
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right 3-4 Columns: Intelligence Sidebar */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-5">
          {/* Notifications Card */}
          <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/70 shadow-sm dark:shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-cyan-500" />
                Notifications
              </h3>
              <button
                onClick={() => onNavigate('notifications')}
                className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-medium"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {db.notifications.slice(0, 5).map(notif => (
                <div key={notif.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 hover:border-cyan-500/40 transition">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{notif.title}</span>
                    <span className="text-[10px] text-slate-500 shrink-0 ml-1">{notif.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-snug">{notif.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Activities Timeline */}
          <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/70 shadow-sm dark:shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-500" />
                Today's Activity Log
              </h3>
              {isScreenPermitted('activity-timeline', currentRole, customPermissions) && (
                <button
                  onClick={() => onNavigate('activity-timeline')}
                  className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-medium"
                >
                  View All
                </button>
              )}
            </div>

            {/* Vertical timeline */}
            <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {db.auditLogs.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">No activity records yet. Real events appear here automatically.</p>
              ) : (
                db.auditLogs.slice(0, 5).map((log, i) => (
                  <div key={log.id || i} className="relative">
                    {/* Node point */}
                    <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 bg-cyan-500 shadow-xs" />
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
                        {log.timestamp.includes(' ') ? log.timestamp.split(' ')[1] : log.timestamp}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{log.action}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{log.details}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions (Filtered by active role permissions) */}
          <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/70 shadow-sm dark:shadow-xl space-y-3 backdrop-blur-md">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-500" />
              Role Actions
            </h3>

            {authorizedQuickActions.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No quick actions configured for this view.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {authorizedQuickActions.map(action => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={action.onClick}
                      className={`p-3 rounded-xl bg-gradient-to-r ${action.gradient} text-white text-xs font-bold shadow-md flex flex-col items-center justify-center gap-1.5 transition text-center cursor-pointer`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{action.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
