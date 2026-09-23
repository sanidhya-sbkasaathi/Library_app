import React, { useState, useEffect } from 'react';
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
  Plus,
  X,
  Trash2,
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

  useEffect(() => {
    db.reconcileSeatOccupancy().catch(() => {});
  }, []);

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

  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomFloor, setNewRoomFloor] = useState('Ground');
  const [newRoomCapacity, setNewRoomCapacity] = useState(50);
  const [newRoomPrefix, setNewRoomPrefix] = useState('C');
  const [newRoomIsAc, setNewRoomIsAc] = useState(true);
  const [newRoomHasWifi, setNewRoomHasWifi] = useState(true);
  const [newRoomHasCharging, setNewRoomHasCharging] = useState(true);

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    try {
      const created = await db.addRoom({
        name: newRoomName.trim(),
        floor: newRoomFloor,
        capacity: Number(newRoomCapacity) || 50,
        seatPrefix: newRoomPrefix.trim().toUpperCase() || 'R',
        isAc: newRoomIsAc,
        hasWifi: newRoomHasWifi,
        hasCharging: newRoomHasCharging,
      });
      setSelectedRoomId(created.id);
      setIsAddRoomOpen(false);
      setNewRoomName('');
    } catch (err: any) {
      alert('Failed to create room: ' + err.message);
    }
  };

  const handleDeleteRoom = async (roomId: string, roomName: string) => {
    if (db.rooms.length <= 1) {
      alert('You must have at least one room in the library.');
      return;
    }
    if (confirm(`Are you sure you want to delete "${roomName}" and all its desks?`)) {
      await db.deleteRoom(roomId);
      setSelectedRoomId(db.rooms[0]?.id || 'room-1');
    }
  };

  return (
    <div className="space-y-5 pb-8 animate-in fade-in duration-300">
      {/* Header & Overall KPI Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/70 shadow-sm dark:shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Armchair className="w-5 h-5 text-cyan-500" />
              Visual Seat Matrix & Rooms
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-cyan-50 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 font-semibold">
              {db.seats.length} Total Desks ({db.rooms.length} Halls)
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time interactive desk allocations, occupancy states, and dynamic multi-room layouts
          </p>
        </div>

        {/* Room Switcher Pills & Add Room Button */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {db.rooms.map(room => (
            <button
              key={room.id}
              onClick={() => setSelectedRoomId(room.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                selectedRoomId === room.id
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>{room.name.split(' - ')[0]}</span>
            </button>
          ))}

          <button
            onClick={() => setIsAddRoomOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 text-xs font-bold border border-cyan-200 dark:border-cyan-500/30 transition flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Room</span>
          </button>
        </div>
      </div>

      {/* Add Room Modal */}
      {isAddRoomOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-cyan-500" />
                Create New Study Room / Hall
              </h3>
              <button
                onClick={() => setIsAddRoomOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRoom} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Room Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Silent Zone Hall C / Discussion Room"
                  value={newRoomName}
                  onChange={e => setNewRoomName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Floor</label>
                  <input
                    type="text"
                    value={newRoomFloor}
                    onChange={e => setNewRoomFloor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Total Desks</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={newRoomCapacity}
                    onChange={e => setNewRoomCapacity(parseInt(e.target.value, 10) || 50)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Prefix</label>
                  <input
                    type="text"
                    maxLength={3}
                    placeholder="e.g. C"
                    value={newRoomPrefix}
                    onChange={e => setNewRoomPrefix(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono uppercase"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="block text-slate-600 dark:text-slate-400 font-semibold">Amenities</label>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRoomIsAc}
                      onChange={e => setNewRoomIsAc(e.target.checked)}
                      className="rounded text-cyan-600"
                    />
                    <span>AC Zone</span>
                  </label>
                  <label className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRoomHasWifi}
                      onChange={e => setNewRoomHasWifi(e.target.checked)}
                      className="rounded text-cyan-600"
                    />
                    <span>Wi-Fi</span>
                  </label>
                  <label className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRoomHasCharging}
                      onChange={e => setNewRoomHasCharging(e.target.checked)}
                      className="rounded text-cyan-600"
                    />
                    <span>Sockets</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddRoomOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-md"
                >
                  Create Room & Generate Seats
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Summary Stat Pills for Selected Room */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">Room Desks</span>
          <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{total}</span>
        </div>
        <div className="p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-emerald-200 dark:border-emerald-500/30 shadow-xs flex items-center justify-between">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Available
          </span>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">{available}</span>
        </div>
        <div className="p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-blue-200 dark:border-blue-500/30 shadow-xs flex items-center justify-between">
          <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Occupied
          </span>
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">{occupied}</span>
        </div>
        <div className="p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-amber-200 dark:border-amber-500/30 shadow-xs flex items-center justify-between">
          <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Reserved
          </span>
          <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">{reserved}</span>
        </div>
        <div className="p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500" />
            Blocked
          </span>
          <span className="font-mono font-bold text-slate-700 dark:text-slate-400 text-sm">{blocked}</span>
        </div>
        <div className="p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-rose-200 dark:border-rose-500/30 shadow-xs flex items-center justify-between">
          <span className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Maintenance
          </span>
          <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">{maintenance}</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/70 shadow-sm dark:shadow-lg flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search seat number or student..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['ALL', 'AVAILABLE', 'OCCUPIED', 'RESERVED', 'BLOCKED'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}

          <button
            onClick={() => window.print()}
            className="p-1.5 ml-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 transition flex items-center gap-1"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Map
          </button>
        </div>
      </div>

      {/* Visual Seat Matrix Grid (A01 - A50 style layout) */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/70 shadow-sm dark:shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
              {currentRoom.name} — {currentRoom.floor}
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
              AC Cooling Active • Dual High-Speed 1Gbps Wi-Fi • CCTV Monitored
            </p>
          </div>
          <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 italic">
            Tap on any seat to inspect, assign, transfer, or release.
          </div>
        </div>

        {/* Seat Grid Layout */}
        <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 sm:gap-3">
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
                className={`group relative p-2.5 rounded-xl cursor-pointer transition-all duration-150 transform hover:-translate-y-0.5 border flex flex-col items-center justify-center text-center shadow-xs ${
                  isAvailable
                    ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/30 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                    : isOccupied
                    ? 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-900/40 border-blue-300 dark:border-blue-500/40 text-blue-800 dark:text-blue-200'
                    : isReserved
                    ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-900/40 border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-200'
                    : isBlocked
                    ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    : 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-300'
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
