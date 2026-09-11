import React, { useState } from 'react';
import {
  X,
  Armchair,
  User,
  Calendar,
  Zap,
  Lock,
  Lamp,
  ArrowRightLeft,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import { Seat, SeatStatus } from '../../types';
import { db } from '../../db/localDatabase';

interface SeatDrawerProps {
  seat: Seat | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: string, param?: any) => void;
}

export const SeatDrawer: React.FC<SeatDrawerProps> = ({
  seat,
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [selectedStudentName, setSelectedStudentName] = useState('');

  if (!isOpen || !seat) return null;

  const handleStatusChange = (newStatus: SeatStatus) => {
    db.updateSeatStatus(seat.id, newStatus, selectedStudentName || undefined);
    onClose();
  };

  const handleRelease = () => {
    if (window.confirm(`Release seat ${seat.seatNumber} to Available status?`)) {
      db.updateSeatStatus(seat.id, 'AVAILABLE');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-700/80 h-full flex flex-col shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Armchair className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-wide">Seat {seat.seatNumber}</h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    seat.status === 'AVAILABLE'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : seat.status === 'OCCUPIED'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : seat.status === 'RESERVED'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : seat.status === 'BLOCKED'
                      ? 'bg-slate-700 text-slate-300 border border-slate-600'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}
                >
                  {seat.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">Row {seat.row} • Col {seat.column} • {seat.type} Desk</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Seat Specification Badges */}
        <div className="grid grid-cols-3 gap-2.5 py-4 border-b border-slate-800">
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-300">Charging Port</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2">
            <Lamp className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-300">Study Lamp</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2">
            <Lock className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-slate-300">Locker Link</span>
          </div>
        </div>

        {/* Occupant Card */}
        <div className="py-4 border-b border-slate-800">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Current Occupant
          </h3>
          {seat.status === 'OCCUPIED' && seat.studentName ? (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold">
                  {seat.studentName[0]}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">{seat.studentName}</h4>
                  <p className="text-xs text-slate-400">{seat.studentId || 'STU-1024'} • {seat.studentMobile || '+91 98765 11001'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/80">
                <div>
                  <span className="text-slate-500 block">Membership Expiry</span>
                  <span className="font-medium text-slate-200">{seat.membershipEnd || '28 Oct 2025'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Attendance Today</span>
                  <span className="font-semibold text-emerald-400">Present (10:15 AM)</span>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    onNavigate('student-profile', seat.studentId || 'STU-1024');
                    onClose();
                  }}
                  className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg transition"
                >
                  View Profile
                </button>
                <button
                  onClick={() => {
                    onNavigate('seat-transfer');
                    onClose();
                  }}
                  className="py-1.5 px-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-medium rounded-lg border border-cyan-500/30 transition flex items-center gap-1"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  Transfer
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-center">
              <p className="text-xs text-slate-400">This seat is currently vacant.</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Ready for new admission or student assignment.</p>
            </div>
          )}
        </div>

        {/* Quick Seat Actions */}
        <div className="py-4 space-y-2 flex-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Seat Operations (Offline-First)
          </h3>

          {seat.status === 'AVAILABLE' && (
            <div className="space-y-2 mb-3">
              <label className="text-xs text-slate-300 block">Assign to Student:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Student name or ID..."
                  value={selectedStudentName}
                  onChange={e => setSelectedStudentName(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={() => handleStatusChange('OCCUPIED')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition"
                >
                  Assign
                </button>
              </div>
            </div>
          )}

          {seat.status === 'OCCUPIED' ? (
            <button
              onClick={handleRelease}
              className="w-full py-2.5 px-4 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Release Seat (Make Available)
            </button>
          ) : (
            <button
              onClick={() => handleStatusChange('RESERVED')}
              className="w-full py-2 px-4 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Hold / Reserve Seat
            </button>
          )}

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={() => handleStatusChange(seat.status === 'BLOCKED' ? 'AVAILABLE' : 'BLOCKED')}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition flex items-center justify-center gap-1.5"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
              {seat.status === 'BLOCKED' ? 'Unblock Seat' : 'Block Seat'}
            </button>

            <button
              onClick={() => handleStatusChange(seat.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE')}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition flex items-center justify-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              {seat.status === 'MAINTENANCE' ? 'Finish Service' : 'Maintenance'}
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between">
          <span>Local Device: Reception PC</span>
          <span>Saved directly to SQLite</span>
        </div>
      </div>
    </div>
  );
};
