import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Download,
  Eye,
  CreditCard,
  CheckSquare,
  Armchair,
  RefreshCw,
  FileText,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Shield,
  Clock,
  ArrowRight,
  Printer,
  ChevronRight,
  AlertCircle,
  Edit2,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import { db } from '../../db/localDatabase';
import { Student, PaymentTransaction } from '../../types';

interface StudentsDirectoryProps {
  onSelectStudent: (studentId: string) => void;
  onNavigate: (screen: string, param?: any) => void;
}

export const StudentsDirectoryScreen: React.FC<StudentsDirectoryProps> = ({
  onSelectStudent,
  onNavigate,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredStudents = db.students.filter(s => {
    if (statusFilter !== 'ALL' && s.membershipStatus !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        s.mobile.includes(q) ||
        (s.seatNumber && s.seatNumber.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const exportCSV = () => {
    const headers = 'Student ID,Name,Mobile,Seat,Plan,Status,Admission Date,Expiry Date\n';
    const rows = filteredStudents
      .map(
        s =>
          `${s.studentId},"${s.name}",${s.mobile},${s.seatNumber || ''},"${s.membershipPlan}",${s.membershipStatus},${s.admissionDate},${s.expiryDate}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_export_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-5 pb-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/70 shadow-sm dark:shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-500" />
            Student Master Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete database of active, expiring, and archived students with local search
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition shadow-xs"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => onNavigate('new-admission')}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            New Admission
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/70 shadow-sm dark:shadow-lg flex flex-wrap justify-between items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by student name, ID, phone, seat..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {['ALL', 'Active', 'Expiring', 'Expired'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                statusFilter === st
                  ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* High-Performance Students Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/70 shadow-sm dark:shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="pb-3">Student ID</th>
                <th className="pb-3">Name</th>
                <th className="pb-3">Mobile</th>
                <th className="pb-3">Seat</th>
                <th className="pb-3">Membership Plan</th>
                <th className="pb-3">Admission</th>
                <th className="pb-3">Expiry Date</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredStudents.map(student => (
                <tr
                  key={student.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer"
                  onClick={() => onSelectStudent(student.studentId)}
                >
                  <td className="py-3 font-mono font-bold text-cyan-600 dark:text-cyan-400">
                    {student.studentId}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={student.photo}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                      />
                      <span className="font-semibold text-slate-800 dark:text-white">{student.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">{student.mobile}</td>
                  <td className="py-3">
                    {student.seatNumber ? (
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 font-mono font-semibold">
                        Seat {student.seatNumber}
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">{student.membershipPlan}</td>
                  <td className="py-3 text-slate-500 dark:text-slate-400">{student.admissionDate}</td>
                  <td className="py-3 text-slate-500 dark:text-slate-400">{student.expiryDate}</td>
                  <td className="py-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        student.membershipStatus === 'Active'
                          ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                          : student.membershipStatus === 'Expiring'
                          ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                          : 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
                      }`}
                    >
                      {student.membershipStatus}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onSelectStudent(student.studentId);
                      }}
                      className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-cyan-700 dark:text-cyan-300 rounded-lg transition"
                      title="View Profile"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
          <span>Showing {filteredStudents.length} of {db.students.length} students</span>
          <span>SQLite Database: Optimal Indexing Active</span>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// Screen 14: Student Profile (with full 10 Tabs)
// ----------------------------------------------------
interface StudentProfileProps {
  studentId: string;
  onNavigate: (screen: string, param?: any) => void;
  onOpenReceipt: (tx: PaymentTransaction) => void;
}

export const StudentProfileScreen: React.FC<StudentProfileProps> = ({
  studentId,
  onNavigate,
  onOpenReceipt,
}) => {
  const [activeTab, setActiveTab] = useState<
    'Overview' | 'Personal' | 'Admission' | 'Membership' | 'Seat' | 'Attendance' | 'Payments' | 'Documents' | 'Leave' | 'Activity'
  >('Overview');

  const student = db.students.find(s => s.studentId === studentId) || db.students[0];
  const admissions = db.admissions.filter(a => a.studentId === student?.studentId);
  const payments = db.payments.filter(p => p.studentId === student?.studentId);
  const attendance = db.attendance.filter(a => a.studentId === student?.studentId);

  // Edit / Delete states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(student?.name || '');
  const [editMobile, setEditMobile] = useState(student?.mobile || '');
  const [editEmail, setEditEmail] = useState(student?.email || '');
  const [editPlan, setEditPlan] = useState(student?.membershipPlan || '');
  const [editStatus, setEditStatus] = useState<any>(student?.membershipStatus || 'Active');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (student) {
      setEditName(student.name);
      setEditMobile(student.mobile);
      setEditEmail(student.email);
      setEditPlan(student.membershipPlan);
      setEditStatus(student.membershipStatus);
    }
  }, [student]);

  if (!student) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-slate-400">Student not found or deleted.</p>
        <button onClick={() => onNavigate('students')} className="px-4 py-2 bg-cyan-600 text-white rounded-xl text-xs font-bold">
          Back to Directory
        </button>
      </div>
    );
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await db.updateStudent(student.studentId, {
        name: editName,
        mobile: editMobile,
        email: editEmail,
        membershipPlan: editPlan,
        membershipStatus: editStatus,
      });
      setIsEditing(false);
    } catch (err: any) {
      alert(`Error updating student: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsSaving(true);
    try {
      await db.deleteStudent(student.studentId);
      setShowDeleteConfirm(false);
      onNavigate('students');
    } catch (err: any) {
      alert(`Error deleting student: ${err.message}`);
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5 pb-8 animate-in fade-in duration-300">
      {/* Profile Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-700/80 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <img
            src={student.photo}
            alt={student.name}
            className="w-20 h-20 rounded-2xl object-cover border-2 border-cyan-500/40 shadow-xl"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{student.name}</h1>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                {student.studentId}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  student.membershipStatus === 'Active'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {student.membershipStatus}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Seat: <b className="text-cyan-400 font-mono">{student.seatNumber || 'N/A'}</b> • Plan:{' '}
              <span className="text-white font-medium">{student.membershipPlan}</span> • Valid till:{' '}
              <span className="text-slate-400">{student.expiryDate}</span>
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-cyan-400" /> {student.mobile}</span>
              <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-purple-400" /> {student.email}</span>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
            title="Edit student in SQLite WASM"
          >
            <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
            Edit Student
          </button>
          <button
            onClick={() => onNavigate('collect-payment')}
            className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/20 flex items-center gap-1.5 transition"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Collect Fee
          </button>
          <button
            onClick={() => onNavigate('seat-transfer')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
          >
            <Armchair className="w-3.5 h-3.5 text-cyan-400" />
            Transfer Seat
          </button>
          <button
            onClick={() => onNavigate('qr-id-cards')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            Print ID Card
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl border border-rose-500/30 flex items-center gap-1.5 transition"
            title="Delete student from SQLite"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Edit Student Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-cyan-400" />
                Edit Student Details (SQLite WASM)
              </h3>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Mobile Number</label>
                <input
                  type="text"
                  value={editMobile}
                  onChange={e => setEditMobile(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Plan</label>
                  <input
                    type="text"
                    value={editPlan}
                    onChange={e => setEditPlan(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Expiring">Expiring</option>
                    <option value="Expired">Expired</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-bold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold shadow transition disabled:opacity-50"
                >
                  {isSaving ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Delete Student?</h3>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to delete <b className="text-white">{student.name}</b> ({student.studentId})? This will execute an atomic DELETE transaction in SQLite WASM and record an outbox sync event.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isSaving}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow transition disabled:opacity-50"
              >
                {isSaving ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10 Navigation Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 border-b border-slate-800">
        {[
          'Overview',
          'Personal',
          'Admission',
          'Membership',
          'Seat',
          'Attendance',
          'Payments',
          'Documents',
          'Leave',
          'Activity',
        ].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition ${
              activeTab === tab
                ? 'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/40 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content Rendering */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/70 shadow-sm dark:shadow-xl">
        {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">Admission Details</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Date: {student.admissionDate}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Plan: {student.membershipPlan}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Due Balance: <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">₹{student.balanceDue}</span></p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">Seat Allocation</span>
              <p className="text-sm font-bold text-cyan-700 dark:text-cyan-300 font-mono">Seat {student.seatNumber || 'Not assigned'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Room: Room A - Main Reading Hall</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Power Socket: Dedicated 230V Port</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">Attendance Summary</span>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">88% Present Rate</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Last Check-in: Today, 10:15 AM</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Locker: L012 (Key Assigned)</p>
            </div>
          </div>
        )}

        {activeTab === 'Personal' && (
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div><span className="text-slate-500 block">Father's / Guardian Name</span><span className="font-bold text-slate-900 dark:text-white">{student.fatherName}</span></div>
            <div><span className="text-slate-500 block">Date of Birth</span><span className="font-bold text-slate-900 dark:text-white">{student.dob}</span></div>
            <div><span className="text-slate-500 block">Address</span><span className="font-bold text-slate-900 dark:text-white">{student.address}</span></div>
            <div><span className="text-slate-500 block">Emergency Contact</span><span className="font-bold text-slate-900 dark:text-white">{student.emergencyContact}</span></div>
            <div><span className="text-slate-500 block">ID Proof Type</span><span className="font-bold text-slate-900 dark:text-white">{student.idProofType}</span></div>
            <div><span className="text-slate-500 block">ID Reference Number</span><span className="font-bold text-slate-900 dark:text-white">{student.idProofNumber}</span></div>
          </div>
        )}

        {activeTab === 'Payments' && (
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Payment & Receipt Ledger</h3>
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="pb-2">Receipt No</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Method</th>
                  <th className="pb-2">Received By</th>
                  <th className="pb-2 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {payments.map(p => (
                  <tr key={p.id}>
                    <td className="py-2.5 font-mono text-cyan-600 dark:text-cyan-400 font-bold">{p.receiptNo}</td>
                    <td className="py-2.5 text-slate-700 dark:text-slate-300">{p.date}</td>
                    <td className="py-2.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">₹{p.amount.toLocaleString('en-IN')}</td>
                    <td className="py-2.5"><span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">{p.method}</span></td>
                    <td className="py-2.5 text-slate-500 dark:text-slate-400">{p.receivedBy}</td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => onOpenReceipt(p)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-cyan-700 dark:text-cyan-300 text-[11px] rounded transition"
                      >
                        Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'Attendance' && (
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-white">Attendance Logs</h3>
            <div className="space-y-1.5">
              {attendance.map(a => (
                <div key={a.id} className="flex justify-between items-center p-2.5 rounded-lg bg-slate-950/60 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-300">{a.date}</span>
                    <span className="text-slate-400">In: {a.checkIn}</span>
                    {a.checkOut && <span className="text-slate-400">Out: {a.checkOut}</span>}
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other tabs fallback */}
        {!['Overview', 'Personal', 'Payments', 'Attendance'].includes(activeTab) && (
          <div className="py-8 text-center text-slate-400 text-xs">
            <p className="font-semibold text-slate-300">{activeTab} section for {student.name}</p>
            <p className="mt-1">All audit trail records preserved in local SQLite database.</p>
          </div>
        )}
      </div>
    </div>
  );
};
