import React, { useState } from 'react';
import {
  ArrowRightLeft,
  Lock,
  Calendar,
  UserCheck,
  AlertTriangle,
  Bell,
  Users,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Building,
  ShieldCheck,
  Check,
  UserX,
  Phone,
  Clock,
  Sparkles,
} from 'lucide-react';
import { db } from '../../db/localDatabase';
import { SeatStatus } from '../../types';

// ----------------------------------------------------
// Screen 27: Seat Transfer Atomic Transaction
// ----------------------------------------------------
export const SeatTransferScreen: React.FC<{
  onNavigate: (screen: string) => void;
}> = ({ onNavigate }) => {
  const [selectedStudentId, setSelectedStudentId] = useState('STU-1027');
  const [toRoomId, setToRoomId] = useState('room-2');
  const [toSeatNumber, setToSeatNumber] = useState('B12');
  const [reason, setReason] = useState('Student requested AC Silent Hall for exam prep');

  const student = db.students.find(s => s.studentId === selectedStudentId) || db.students[0];
  const targetRoom = db.rooms.find(r => r.id === toRoomId) || db.rooms[1];

  const handleExecuteTransfer = () => {
    try {
      db.transferSeatTransaction({
        studentId: student.studentId,
        fromSeatNumber: student.seatNumber || 'A23',
        toRoomId,
        toSeatNumber,
        reason,
      });
      alert(`Transfer complete! ${student.name} moved to Seat ${toSeatNumber}.`);
      onNavigate('seats');
    } catch (e) {
      alert('Transfer failed: ' + e);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8 animate-in fade-in duration-300">
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700/70 shadow-xl">
        <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-cyan-400" />
          Seat Transfer Transaction
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Atomic seat swap: releases previous desk, allocates new desk, and records audit trail
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-700/70 shadow-2xl space-y-5 text-xs">
        {/* Student Selector */}
        <div>
          <label className="block text-slate-400 mb-1 font-medium">Select Student to Transfer</label>
          <select
            value={selectedStudentId}
            onChange={e => setSelectedStudentId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-cyan-500"
          >
            {db.students.filter(s => !!s.seatNumber).map(s => (
              <option key={s.id} value={s.studentId}>
                {s.name} ({s.studentId}) — Currently at Seat {s.seatNumber}
              </option>
            ))}
          </select>
        </div>

        {/* Visual Comparison Box */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              CURRENT SEAT (RELEASED)
            </span>
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300">
              <span className="text-lg font-mono font-bold block">Seat {student.seatNumber || 'A23'}</span>
              <span className="text-xs text-slate-400">Room A - Main Reading Hall</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
              NEW DESTINATION SEAT
            </span>
            <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
              <span className="text-lg font-mono font-bold block">Seat {toSeatNumber}</span>
              <span className="text-xs text-slate-400">{targetRoom.name}</span>
            </div>
          </div>
        </div>

        {/* Destination Target Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 mb-1">Target Room</label>
            <select
              value={toRoomId}
              onChange={e => setToRoomId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
            >
              {db.rooms.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">New Seat Number</label>
            <input
              type="text"
              value={toSeatNumber}
              onChange={e => setToSeatNumber(e.target.value.toUpperCase())}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-cyan-300 font-mono font-bold uppercase"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-400 mb-1">Transfer Reason / Remarks</label>
          <input
            type="text"
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
          />
        </div>

        <div className="pt-2 flex justify-end gap-3">
          <button
            onClick={() => onNavigate('seats')}
            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleExecuteTransfer}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-bold shadow-lg shadow-cyan-500/20 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Confirm & Execute Transfer
          </button>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// Screen 28: Locker Management (Visual Grid L001 - L040)
// ----------------------------------------------------
export const LockersScreen: React.FC = () => {
  const [selectedLocker, setSelectedLocker] = useState<string | null>(null);

  const lockers = db.lockers;
  const occupiedCount = lockers.filter(l => l.status === 'OCCUPIED').length;
  const availableCount = lockers.filter(l => l.status === 'AVAILABLE').length;

  const handleToggleLocker = (lockerNo: string) => {
    const lkr = lockers.find(l => l.lockerNo === lockerNo);
    if (!lkr) return;
    const newStatus = lkr.status === 'AVAILABLE' ? 'OCCUPIED' : 'AVAILABLE';
    db.updateLocker(lockerNo, newStatus, newStatus === 'OCCUPIED' ? 'Assigned Student' : undefined);
  };

  return (
    <div className="space-y-5 pb-8 animate-in fade-in duration-300">
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700/70 shadow-xl flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-purple-400" />
            Locker Management Matrix
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Safe storage cubicles (L001 - L040) with physical key tracking and deposits
          </p>
        </div>

        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> {availableCount} Available
          </span>
          <span className="flex items-center gap-1.5 text-blue-400 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> {occupiedCount} Occupied
          </span>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-700/70 shadow-2xl">
        <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-10 gap-3">
          {lockers.map(lkr => {
            const isOcc = lkr.status === 'OCCUPIED';
            return (
              <div
                key={lkr.id}
                onClick={() => handleToggleLocker(lkr.lockerNo)}
                className={`p-3 rounded-xl border text-center cursor-pointer transition flex flex-col items-center justify-center ${
                  isOcc
                    ? 'bg-purple-950/30 border-purple-500/40 text-purple-200 hover:border-purple-400'
                    : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300 hover:border-emerald-400'
                }`}
              >
                <Lock className="w-5 h-5 mb-1 opacity-80" />
                <span className="font-mono font-bold text-xs">{lkr.lockerNo}</span>
                <span className="text-[9px] block uppercase font-medium mt-0.5 opacity-75">
                  {isOcc ? 'Occupied' : 'Free'}
                </span>
              </div>
            );
          })}
        </div>

        <div className="pt-6 mt-6 border-t border-slate-800 text-xs text-slate-400 flex justify-between">
          <span>Click any locker to toggle assignment state</span>
          <span>Deposit standard: ₹500 refundable</span>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// Screen 30: Visitor Register
// ----------------------------------------------------
export const VisitorsScreen: React.FC = () => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [purpose, setPurpose] = useState('Admission inquiry');
  const [visitedPerson, setVisitedPerson] = useState('Rahul Sharma (Admin)');

  const handleAdd = () => {
    if (!name || !mobile) return;
    db.addVisitor({
      name,
      mobile,
      purpose,
      visitedPerson,
      entryTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: '28 Apr 2025',
    });
    setName('');
    setMobile('');
  };

  return (
    <div className="space-y-5 pb-8 animate-in fade-in duration-300">
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700/70 shadow-xl flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-cyan-400" />
            Visitor & Inquiry Register
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gate entry log for parents, admission inquiries, and external guests
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Entry Form (4 cols) */}
        <div className="md:col-span-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-700/70 shadow-xl space-y-3 text-xs">
          <h3 className="font-bold text-sm text-white">New Visitor Entry</h3>
          <div>
            <label className="block text-slate-400 mb-1">Visitor Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Rajesh Meena"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Mobile Number</label>
            <input
              type="tel"
              value={mobile}
              onChange={e => setMobile(e.target.value)}
              placeholder="+91 98765 00000"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Purpose of Visit</label>
            <input
              type="text"
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
            />
          </div>
          <button
            onClick={handleAdd}
            className="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl mt-2"
          >
            Check In Visitor
          </button>
        </div>

        {/* Visitors Table (8 cols) */}
        <div className="md:col-span-8 p-5 rounded-2xl bg-slate-900/90 border border-slate-700/70 shadow-xl">
          <h3 className="font-bold text-sm text-white mb-3">Today's Visitors</h3>
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="pb-2">Name</th>
                <th className="pb-2">Contact</th>
                <th className="pb-2">Purpose</th>
                <th className="pb-2">Entry</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {db.visitors.map(v => (
                <tr key={v.id}>
                  <td className="py-2.5 font-semibold text-white">{v.name}</td>
                  <td className="py-2.5 text-slate-400">{v.mobile}</td>
                  <td className="py-2.5 text-slate-300">{v.purpose}</td>
                  <td className="py-2.5 text-slate-400">{v.entryTime}</td>
                  <td className="py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        v.status === 'Inside'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {v.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    {v.status === 'Inside' && (
                      <button
                        onClick={() => db.exitVisitor(v.id)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-rose-300 text-[10px] rounded"
                      >
                        Exit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// Screen 31: Complaint Management
// ----------------------------------------------------
export const ComplaintsScreen: React.FC = () => {
  const complaints = db.complaints;

  return (
    <div className="space-y-5 pb-8 animate-in fade-in duration-300">
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700/70 shadow-xl flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Complaint & Facility Service Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Student grievances regarding AC, Wi-Fi, noise, or lighting with resolution workflows
          </p>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700/70 shadow-2xl space-y-4">
        {complaints.map(cmp => (
          <div key={cmp.id} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-cyan-400 font-bold mr-2">{cmp.complaintNo}</span>
                <span className="font-bold text-white text-sm">{cmp.studentName}</span>
                <span className="text-slate-400 text-[11px] ml-2 font-medium">Category: {cmp.category}</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                  cmp.status === 'Resolved'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {cmp.status}
              </span>
            </div>
            <p className="text-slate-300">{cmp.description}</p>
            {cmp.resolution && (
              <p className="text-emerald-400 text-[11px] bg-emerald-950/30 p-2 rounded border border-emerald-800/40">
                Resolution: {cmp.resolution}
              </p>
            )}
            <div className="flex justify-between text-slate-500 text-[10px] pt-1">
              <span>Assigned: {cmp.assignedStaff}</span>
              <span>Date: {cmp.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ----------------------------------------------------
// Screen 32: Notice Board
// ----------------------------------------------------
export const NoticesScreen: React.FC = () => {
  const notices = db.notices;

  return (
    <div className="space-y-5 pb-8 animate-in fade-in duration-300">
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700/70 shadow-xl flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            Digital Notice Board
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Important announcements, holiday updates, and operating rule notifications
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notices.map(n => (
          <div key={n.id} className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700/70 shadow-xl space-y-2.5">
            <div className="flex justify-between items-start">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {n.category}
              </span>
              <span className="text-[11px] text-slate-400">{n.date}</span>
            </div>
            <h3 className="font-bold text-sm text-white">{n.title}</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{n.content}</p>
            <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800 flex justify-between">
              <span>Audience: {n.audience}</span>
              <span className="text-emerald-400">● Active</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ----------------------------------------------------
// Screen 33: Staff Directory
// ----------------------------------------------------
export const StaffScreen: React.FC = () => {
  return (
    <div className="space-y-5 pb-8 animate-in fade-in duration-300">
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700/70 shadow-xl flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Staff & Personnel Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Employees, shift allocations, monthly salaries, and security officers
          </p>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700/70 shadow-2xl overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead className="text-[11px] text-slate-400 border-b border-slate-800">
            <tr>
              <th className="pb-3">Name</th>
              <th className="pb-3">Role</th>
              <th className="pb-3">Contact</th>
              <th className="pb-3">Shift Schedule</th>
              <th className="pb-3">Monthly Salary</th>
              <th className="pb-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {db.staff.map(s => (
              <tr key={s.id}>
                <td className="py-3 font-semibold text-white">{s.name}</td>
                <td className="py-3 text-cyan-300 font-medium">{s.role}</td>
                <td className="py-3 text-slate-400">{s.mobile}</td>
                <td className="py-3 text-slate-300">{s.shift}</td>
                <td className="py-3 font-mono font-bold text-emerald-400">₹{s.salary.toLocaleString('en-IN')}</td>
                <td className="py-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
