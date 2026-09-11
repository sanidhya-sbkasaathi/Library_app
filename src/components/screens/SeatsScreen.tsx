import React, { useState } from 'react';
import {
  Armchair,
  Filter,
  Search,
  Building,
  Printer,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Zap,
} from 'lucide-react';
import { db } from '../../db/localDatabase';
import { Seat, SeatStatus } from '../../types';

interface SeatsScreenProps {
  onSelectSeat: (seat: Seat) => void;
  onNavigate: (screen: string, param?: any) => void;
}

export const SeatsScreen: React.FC<SeatsScreenProps> = ({
  onSelectSeat,
  onNavigate,
}) => {
  const [selectedRoomId, setSelectedRoomId] = useState('room-1');
  const [statusFilter, setStatusFilter] = useState<'ALL' | SeatStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const currentRoom = db.rooms.find(r => r.id === selectedRoomId) || db.rooms[0];
  const roomSeats = db.seats.filter(s => s.roomId === selectedRoomId);

  // Filter seats
  const filteredSeats = roomSeats.filter(seat => {
    if (statusFilter !== 'ALL' && seat.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNo = seat.seatNumber.toLowerCase().includes(q);
      const matchStu = seat.studentName?.toLowerCase().includes(q);
      if (!matchNo && !matchStu) return false;
    }
    return true;
  });

  // Calculate totals
  const total = roomSeats.length;
  const occupied = roomSeats.filter(s => s.status === 'OCCUPIED').length;
  const available = roomSeats.filter(s => s.status === 'AVAILABLE').length;
  const reserved = roomSeats.filter(s => s.status === 'RESERVED').length;
  const blocked = roomSeats.filter(s => s.status === 'BLOCKED').length;
  const maintenance = roomSeats.filter(s => s.status === 'MAINTENANCE').length;

  return (
    <div className="space-y-5 pb-8 animate-in fade-in duration-300">
      {/* Header & Overall KPI Bar */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700/70 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Armchair className="w-5 h-5 text-cyan-400" />
              Visual Seat Matrix & Hall Layout
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
              1,100 Total Desks
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time interactive desk allocations, occupancy states, and student assignments
          </p>
        </div>

        {/* Room Switcher Pills */}
        <div className="flex flex-wrap gap-2">
          {db.rooms.map(room => (
            <button
              key={room.id}
              onClick={() => setSelectedRoomId(room.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                selectedRoomId === room.id
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>{room.name.split(' - ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stat Pills for Selected Room */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">Room Desks</span>
          <span className="font-mono font-bold text-white text-sm">{total}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30 flex items-center justify-between">
          <span className="text-xs text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Available
          </span>
          <span className="font-mono font-bold text-emerald-400 text-sm">{available}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/90 border border-blue-500/30 flex items-center justify-between">
          <span className="text-xs text-blue-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Occupied
          </span>
          <span className="font-mono font-bold text-blue-400 text-sm">{occupied}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/30 flex items-center justify-between">
          <span className="text-xs text-amber-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Reserved
          </span>
          <span className="font-mono font-bold text-amber-400 text-sm">{reserved}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700 flex items-center justify-between">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            Blocked
          </span>
          <span className="font-mono font-bold text-slate-400 text-sm">{blocked}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/90 border border-rose-500/30 flex items-center justify-between">
          <span className="text-xs text-rose-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Maintenance
          </span>
          <span className="font-mono font-bold text-rose-400 text-sm">{maintenance}</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700/70 shadow-lg flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search seat number or student..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['ALL', 'AVAILABLE', 'OCCUPIED', 'RESERVED', 'BLOCKED', 'MAINTENANCE'] as const).map(
            st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  statusFilter === st
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {st}
              </button>
            )
          )}

          <button
            onClick={() => window.print()}
            className="p-1.5 ml-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition flex items-center gap-1"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Map
          </button>
        </div>
      </div>

      {/* Visual Seat Matrix Grid (A01 - A50 style layout) */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-700/70 shadow-2xl">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              {currentRoom.name} — {currentRoom.floor}
            </h2>
            <p className="text-xs text-slate-400">
              AC Cooling Active • Dual High-Speed 1Gbps Wi-Fi • CCTV Monitored
            </p>
          </div>
          <div className="text-xs text-slate-400 italic">
            Click on any seat to inspect, assign, transfer, or release.
          </div>
        </div>

        {/* Seat Grid Layout */}
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
          {filteredSeats.map(seat => {
            const isAvailable = seat.status === 'AVAILABLE';
            const isOccupied = seat.status === 'OCCUPIED';
            const isReserved = seat.status === 'RESERVED';
            const isBlocked = seat.status === 'BLOCKED';
            const isMaint = seat.status === 'MAINTENANCE';

            return (
              <div
                key={seat.id}
                onClick={() => onSelectSeat(seat)}
                className={`group relative p-2.5 rounded-xl cursor-pointer transition-all duration-150 transform hover:-translate-y-0.5 border flex flex-col items-center justify-center text-center shadow-md ${
                  isAvailable
                    ? 'bg-emerald-950/20 hover:bg-emerald-900/30 border-emerald-500/40 text-emerald-300 hover:border-emerald-400'
                    : isOccupied
                    ? 'bg-blue-950/30 hover:bg-blue-900/40 border-blue-500/40 text-blue-200 hover:border-blue-400'
                    : isReserved
                    ? 'bg-amber-950/30 hover:bg-amber-900/40 border-amber-500/40 text-amber-200 hover:border-amber-400'
                    : isBlocked
                    ? 'bg-slate-950 hover:bg-slate-800 border-slate-700 text-slate-400'
                    : 'bg-rose-950/30 hover:bg-rose-900/40 border-rose-500/40 text-rose-300'
                }`}
              >
                {/* Status Dot */}
                <span
                  className={`w-2 h-2 rounded-full absolute top-1.5 right-1.5 ${
                    isAvailable
                      ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                      : isOccupied
                      ? 'bg-blue-400 shadow-[0_0_8px_#60a5fa]'
                      : isReserved
                      ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
                      : isBlocked
                      ? 'bg-slate-500'
                      : 'bg-rose-400'
                  }`}
                />

                {/* Desk Icon */}
                <Armchair className="w-5 h-5 mb-1 opacity-80 group-hover:scale-110 transition" />

                {/* Seat Number */}
                <span className="font-mono font-bold text-xs tracking-wider block">
                  {seat.seatNumber}
                </span>

                {/* Student initials or Vacant text */}
                <span className="text-[10px] truncate max-w-[65px] block font-medium mt-0.5 opacity-75">
                  {isOccupied ? seat.studentName?.split(' ')[0] : seat.status.toLowerCase()}
                </span>
              </div>
            );
          })}
        </div>

        {filteredSeats.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-sm">
            No desks matching query in this room.
          </div>
        )}
      </div>
    </div>
  );
};
