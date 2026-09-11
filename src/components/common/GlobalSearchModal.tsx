import React, { useState, useEffect } from 'react';
import { Search, User, CreditCard, Armchair, Shield, Bell, FileText, ArrowRight, X } from 'lucide-react';
import { db } from '../../db/localDatabase';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screenId: string, param?: any) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        // Toggle search
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  // Search Results
  const matchedStudents = db.students.filter(
    s =>
      s.name.toLowerCase().includes(cleanQuery) ||
      s.studentId.toLowerCase().includes(cleanQuery) ||
      s.mobile.includes(cleanQuery) ||
      (s.seatNumber && s.seatNumber.toLowerCase().includes(cleanQuery))
  ).slice(0, 4);

  const matchedPayments = db.payments.filter(
    p =>
      p.receiptNo.toLowerCase().includes(cleanQuery) ||
      p.studentName.toLowerCase().includes(cleanQuery)
  ).slice(0, 3);

  const matchedSeats = db.seats.filter(
    s =>
      s.seatNumber.toLowerCase().includes(cleanQuery) ||
      (s.studentName && s.studentName.toLowerCase().includes(cleanQuery))
  ).slice(0, 4);

  const matchedStaff = db.staff.filter(
    s =>
      s.name.toLowerCase().includes(cleanQuery) ||
      s.role.toLowerCase().includes(cleanQuery)
  ).slice(0, 2);

  const totalResults =
    matchedStudents.length + matchedPayments.length + matchedSeats.length + matchedStaff.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/75 backdrop-blur-md p-4">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-950/70">
          <Search className="w-5 h-5 text-cyan-400 mr-3 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search students, seats, receipts, staff, notices... (Type to search)"
            className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-400 bg-slate-800 border border-slate-700 rounded mr-2">
            ESC
          </kbd>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!query ? (
            <div className="p-4 text-center">
              <p className="text-xs text-slate-400">Quick suggestions across operational database:</p>
              <div className="flex flex-wrap justify-center gap-2 mt-3">
                {['STU-1024', 'Pooja Sharma', 'Seat A12', 'REC-78456', 'Room B', 'UPI'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-300 rounded-lg border border-slate-700 transition"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : totalResults === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No matching records found in local SQLite database for "{query}".
            </div>
          ) : (
            <>
              {/* Students */}
              {matchedStudents.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    Students ({matchedStudents.length})
                  </h4>
                  <div className="space-y-1">
                    {matchedStudents.map(student => (
                      <div
                        key={student.id}
                        onClick={() => {
                          onNavigate('student-profile', student.studentId);
                          onClose();
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/80 cursor-pointer transition border border-transparent hover:border-slate-700 group"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={student.photo}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover border border-slate-700"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-white group-hover:text-cyan-300 transition">
                                {student.name}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                                {student.studentId}
                              </span>
                            </div>
                            <span className="text-xs text-slate-400">
                              {student.seatNumber ? `Seat ${student.seatNumber}` : 'No Seat'} • {student.membershipPlan}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Seats */}
              {matchedSeats.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                    <Armchair className="w-3.5 h-3.5 text-cyan-400" />
                    Seats Matrix ({matchedSeats.length})
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {matchedSeats.map(seat => (
                      <div
                        key={seat.id}
                        onClick={() => {
                          onNavigate('seats');
                          onClose();
                        }}
                        className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 cursor-pointer transition flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-white">{seat.seatNumber}</span>
                            <span
                              className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                                seat.status === 'OCCUPIED'
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : seat.status === 'AVAILABLE'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              {seat.status}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 block truncate max-w-[150px]">
                            {seat.studentName || 'Vacant desk'}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payments */}
              {matchedPayments.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                    Payments & Receipts ({matchedPayments.length})
                  </h4>
                  <div className="space-y-1">
                    {matchedPayments.map(pay => (
                      <div
                        key={pay.id}
                        onClick={() => {
                          onNavigate('transactions');
                          onClose();
                        }}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/80 cursor-pointer transition border border-transparent hover:border-slate-700"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/40 px-2 py-1 rounded border border-cyan-800/40">
                            {pay.receiptNo}
                          </span>
                          <span className="text-xs text-slate-200">{pay.studentName}</span>
                          <span className="text-[10px] text-slate-500">• {pay.method}</span>
                        </div>
                        <span className="font-mono font-bold text-xs text-emerald-400">
                          ₹{pay.amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
          <span>Search locally across 25,000 students</span>
          <span>Press Enter to select</span>
        </div>
      </div>
    </div>
  );
};
