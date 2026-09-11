import React, { useState } from 'react';
import {
  Printer,
  QrCode,
  Download,
  CreditCard,
  CheckCircle2,
  Sparkles,
  Building,
} from 'lucide-react';
import { db } from '../../db/localDatabase';

export const QRIdCardsScreen: React.FC = () => {
  const [selectedStudentId, setSelectedStudentId] = useState('STU-1024');
  const student = db.students.find(s => s.studentId === selectedStudentId) || db.students[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5 pb-8 animate-in fade-in duration-300">
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700/70 shadow-xl flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <QrCode className="w-5 h-5 text-cyan-400" />
            Student Smart ID Card & QR Generator
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Official PVC & paper ID cards with biometric QR codes for automated turnstile gate access
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl shadow-lg flex items-center gap-1.5 text-xs"
        >
          <Printer className="w-4 h-4" />
          Print Student ID Card
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Selector (5 cols) */}
        <div className="md:col-span-5 p-5 rounded-2xl bg-slate-900/90 border border-slate-700/70 shadow-xl space-y-4 text-xs">
          <label className="block text-slate-400 font-medium">Select Student to Generate ID</label>
          <select
            value={selectedStudentId}
            onChange={e => setSelectedStudentId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-cyan-500"
          >
            {db.students.map(s => (
              <option key={s.id} value={s.studentId}>
                {s.name} ({s.studentId}) — Seat {s.seatNumber || 'N/A'}
              </option>
            ))}
          </select>

          <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-400">Membership:</span>
              <span className="font-semibold text-white">{student.membershipPlan}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Allocated Seat:</span>
              <span className="font-mono text-cyan-400 font-bold">Seat {student.seatNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Card Validity:</span>
              <span className="font-medium text-emerald-400">{student.expiryDate}</span>
            </div>
          </div>
        </div>

        {/* Live ID Card Preview (7 cols) */}
        <div className="md:col-span-7 flex justify-center items-center p-6 rounded-2xl bg-slate-900/90 border border-slate-700/70 shadow-2xl">
          {/* Printable ID Card */}
          <div className="printable-receipt w-[360px] h-[225px] rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-5 border-2 border-cyan-500/40 relative flex flex-col justify-between">
            {/* Ambient Corner Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex justify-between items-start border-b border-cyan-500/30 pb-2 relative z-10">
              <div>
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-cyan-300">
                  Knowledge Library
                </h2>
                <p className="text-[9px] text-slate-300">Smart Study Center • Jaipur</p>
              </div>
              <span className="text-[9px] font-mono font-bold bg-cyan-500/20 px-1.5 py-0.5 rounded text-cyan-300 border border-cyan-500/30">
                STUDENT PASS
              </span>
            </div>

            {/* Content Middle */}
            <div className="flex gap-4 items-center relative z-10">
              <img
                src={student.photo}
                alt=""
                className="w-16 h-16 rounded-xl object-cover border-2 border-cyan-400 shadow-md"
              />
              <div className="space-y-0.5 text-xs">
                <h3 className="font-bold text-sm text-white">{student.name}</h3>
                <p className="text-[10px] font-mono text-cyan-300 font-bold">{student.studentId}</p>
                <p className="text-[10px] text-slate-300">
                  Seat: <b className="text-white font-mono">{student.seatNumber || 'Standard'}</b>
                </p>
                <p className="text-[9px] text-emerald-300 font-medium">Valid Till: {student.expiryDate}</p>
              </div>

              {/* QR Code */}
              <div className="ml-auto p-1.5 bg-white rounded-lg shadow shrink-0">
                <QrCode className="w-12 h-12 text-slate-950" />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center text-[8px] text-slate-400 border-t border-slate-800 pt-1.5 relative z-10">
              <span>Emergency: {student.emergencyContact}</span>
              <span className="font-mono">VERIFIED STUDENT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
