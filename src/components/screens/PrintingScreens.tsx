import React, { useState } from 'react';
import {
  Printer,
  QrCode,
  Download,
  CreditCard,
  CheckCircle2,
  Sparkles,
  Building,
  User,
  ShieldCheck,
} from 'lucide-react';
import { db } from '../../db/localDatabase';

export const QRIdCardsScreen: React.FC = () => {
  const students = db.students;
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.studentId || 'STU-1024'
  );

  const student = students.find(s => s.studentId === selectedStudentId) || students[0];
  const library = db.getCurrentAssociation() || db.associations[0];
  const libraryName = library?.name || 'Knowledge Library';
  const libraryCity = [library?.city, library?.state].filter(Boolean).join(' • ') || 'Smart Study Center • Jaipur';

  // Standard Direct Browser Print (utilizes @media print with exact color preservation)
  const handlePrint = () => {
    window.print();
  };

  // Dedicated High-Fidelity PVC Card Print in isolated window
  const handlePrintIsolated = () => {
    if (!student) return;

    const printWin = window.open('', '_blank', 'width=700,height=500');
    if (!printWin) {
      window.print();
      return;
    }

    const cardHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Student ID Card - ${student.name} (${student.studentId})</title>
          <style>
            @page {
              size: auto;
              margin: 10mm;
            }
            body {
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              background-color: #f8fafc;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .id-card-wrapper {
              width: 360px;
              height: 225px;
              border-radius: 16px;
              overflow: hidden;
              background: linear-gradient(135deg, #091024 0%, #0f1d40 50%, #091024 100%);
              color: #ffffff;
              padding: 18px 20px;
              box-sizing: border-box;
              border: 2px solid #06b6d4;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            }
            .card-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 1px solid rgba(6, 182, 212, 0.35);
              padding-bottom: 8px;
            }
            .library-title {
              font-size: 13px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #67e8f9;
            }
            .library-sub {
              font-size: 9px;
              color: #cbd5e1;
              margin-top: 1px;
            }
            .pass-badge {
              font-size: 8px;
              font-weight: 800;
              background: rgba(6, 182, 212, 0.2);
              color: #67e8f9;
              padding: 2px 6px;
              border-radius: 4px;
              border: 1px solid rgba(6, 182, 212, 0.4);
              letter-spacing: 0.5px;
            }
            .card-body {
              display: flex;
              align-items: center;
              gap: 14px;
              margin: 10px 0;
            }
            .photo {
              width: 66px;
              height: 66px;
              border-radius: 12px;
              object-fit: cover;
              border: 2px solid #22d3ee;
            }
            .student-meta {
              flex: 1;
            }
            .student-name {
              font-size: 14px;
              font-weight: 800;
              color: #ffffff;
              margin: 0;
            }
            .student-id {
              font-family: monospace;
              font-size: 11px;
              color: #67e8f9;
              font-weight: 700;
              margin: 2px 0;
            }
            .meta-line {
              font-size: 10px;
              color: #cbd5e1;
              margin: 1px 0;
            }
            .meta-line b {
              color: #ffffff;
            }
            .validity {
              font-size: 9px;
              color: #34d399;
              font-weight: 600;
              margin-top: 2px;
            }
            .qr-box {
              background: #ffffff;
              padding: 5px;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .card-footer {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 8px;
              color: #94a3b8;
              border-top: 1px solid rgba(255, 255, 255, 0.1);
              padding-top: 6px;
            }
          </style>
        </head>
        <body>
          <div class="id-card-wrapper">
            <div class="card-header">
              <div>
                <div class="library-title">${libraryName}</div>
                <div class="library-sub">${libraryCity}</div>
              </div>
              <span class="pass-badge">STUDENT PASS</span>
            </div>

            <div class="card-body">
              <img src="${student.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}" class="photo" alt="Photo" />
              <div class="student-meta">
                <div class="student-name">${student.name}</div>
                <div class="student-id">${student.studentId}</div>
                <div class="meta-line">Seat: <b>${student.seatNumber || 'Standard'}</b></div>
                <div class="validity">Valid Till: ${student.expiryDate || 'Active'}</div>
              </div>
              <div class="qr-box">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2"/>
                  <path d="M7 7h.01M17 7h.01M7 17h.01M17 17h.01M12 7v10M7 12h10"/>
                </svg>
              </div>
            </div>

            <div class="card-footer">
              <span>Emergency: ${student.emergencyContact || student.mobile || 'Registered Desk'}</span>
              <span style="font-weight: 700; letter-spacing: 0.5px;">VERIFIED STUDENT</span>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(cardHtml);
    printWin.document.close();
  };

  if (!student) {
    return (
      <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
        <CreditCard className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">No Students Enrolled Yet</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Add students via the New Admission screen to generate and print biometric QR & PVC ID cards.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8 animate-in fade-in duration-300">
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/70 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <QrCode className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            Student Smart ID Card & QR Generator
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official PVC & paper ID cards with biometric QR codes for automated turnstile gate access
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handlePrintIsolated}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg flex items-center gap-1.5 text-xs transition cursor-pointer"
            title="High-resolution PVC print in separate window"
          >
            <Printer className="w-4 h-4" />
            Print Student ID Card
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Selector (5 cols) */}
        <div className="md:col-span-5 p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/70 shadow-xl space-y-4 text-xs">
          <label className="block text-slate-600 dark:text-slate-400 font-medium">Select Student to Generate ID</label>
          <select
            value={selectedStudentId}
            onChange={e => setSelectedStudentId(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium focus:border-cyan-500"
          >
            {students.map(s => (
              <option key={s.id} value={s.studentId}>
                {s.name} ({s.studentId}) — Seat {s.seatNumber || 'N/A'}
              </option>
            ))}
          </select>

          <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Membership:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{student.membershipPlan || 'Standard'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Allocated Seat:</span>
              <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">Seat {student.seatNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Card Validity:</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">{student.expiryDate || 'Active'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Organization:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[170px]">{libraryName}</span>
            </div>
          </div>
        </div>

        {/* Live ID Card Preview (7 cols) */}
        <div className="md:col-span-7 flex justify-center items-center p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/70 shadow-xl">
          {/* Printable ID Card */}
          <div
            id="student-id-card-element"
            className="printable-id-card w-[360px] h-[225px] rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-5 border-2 border-cyan-500/40 relative flex flex-col justify-between"
          >
            {/* Ambient Corner Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex justify-between items-start border-b border-cyan-500/30 pb-2 relative z-10">
              <div>
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-cyan-300">
                  {libraryName}
                </h2>
                <p className="text-[9px] text-slate-300">{libraryCity}</p>
              </div>
              <span className="text-[9px] font-mono font-bold bg-cyan-500/20 px-1.5 py-0.5 rounded text-cyan-300 border border-cyan-500/30">
                STUDENT PASS
              </span>
            </div>

            {/* Content Middle */}
            <div className="flex gap-4 items-center relative z-10">
              <img
                src={student.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt=""
                className="w-16 h-16 rounded-xl object-cover border-2 border-cyan-400 shadow-md"
              />
              <div className="space-y-0.5 text-xs">
                <h3 className="font-bold text-sm text-white">{student.name}</h3>
                <p className="text-[10px] font-mono text-cyan-300 font-bold">{student.studentId}</p>
                <p className="text-[10px] text-slate-300">
                  Seat: <b className="text-white font-mono">{student.seatNumber || 'Standard'}</b>
                </p>
                <p className="text-[9px] text-emerald-300 font-medium">Valid Till: {student.expiryDate || 'Active'}</p>
              </div>

              {/* QR Code */}
              <div className="ml-auto p-1.5 bg-white rounded-lg shadow shrink-0">
                <QrCode className="w-12 h-12 text-slate-950" />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center text-[8px] text-slate-400 border-t border-slate-800 pt-1.5 relative z-10">
              <span>Emergency: {student.emergencyContact || student.mobile || 'Office'}</span>
              <span className="font-mono">VERIFIED STUDENT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
