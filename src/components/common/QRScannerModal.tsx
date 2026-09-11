import React, { useState } from 'react';
import { QrCode, X, CheckCircle2, AlertCircle, Sparkles, User, RefreshCw } from 'lucide-react';
import { db } from '../../db/localDatabase';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleProcessCode = (code: string) => {
    setIsProcessing(true);
    setScanResult(null);

    setTimeout(() => {
      const res = db.recordAttendance(code.trim());
      setScanResult(res);
      setIsProcessing(false);
      if (res.success && onSuccess) {
        onSuccess(res.message);
      }
    }, 400);
  };

  const handleSimulateStudentScan = (studentId: string) => {
    setManualCode(studentId);
    handleProcessCode(studentId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">QR / Barcode Attendance Scanner</h3>
              <p className="text-xs text-slate-400">Offline biometric & QR gate verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner Viewfinder Simulation */}
        <div className="p-6 flex flex-col items-center">
          <div className="relative w-64 h-64 rounded-2xl bg-slate-950 border-2 border-dashed border-cyan-500/50 flex flex-col items-center justify-center overflow-hidden shadow-inner">
            {/* Animated Laser Scanning Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse shadow-[0_0_15px_#22d3ee]" />

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
              <QrCode className="w-20 h-20 text-cyan-400/80 mx-auto animate-pulse" />
              <p className="text-[11px] text-slate-400 mt-2 font-mono">Point camera at Student ID QR</p>
            </div>

            {/* Corner brackets */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />
          </div>

          {/* Scan result alert */}
          {scanResult && (
            <div
              className={`mt-4 w-full p-3 rounded-xl flex items-center gap-2.5 text-xs font-semibold ${
                scanResult.success
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {scanResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <span>{scanResult.message}</span>
            </div>
          )}

          {/* Quick Simulation Buttons */}
          <div className="w-full mt-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Quick Scan Simulation (Click to Check-in/out):
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'STU-1024', name: 'Pooja Sharma', seat: 'A12' },
                { id: 'STU-1025', name: 'Amit Verma', seat: 'B07' },
                { id: 'STU-1026', name: 'Sneha Patel', seat: 'C15' },
                { id: 'STU-1027', name: 'Rohit Singh', seat: 'A23' },
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => handleSimulateStudentScan(s.id)}
                  disabled={isProcessing}
                  className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-left transition flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-white block">{s.name}</span>
                    <span className="text-[10px] text-slate-400">{s.id} • Seat {s.seat}</span>
                  </div>
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                </button>
              ))}
            </div>
          </div>

          {/* Manual Input Alternative */}
          <div className="w-full mt-4 flex gap-2">
            <input
              type="text"
              placeholder="Or enter Student ID manually (e.g. STU-1028)..."
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleProcessCode(manualCode)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={() => handleProcessCode(manualCode)}
              disabled={isProcessing || !manualCode}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-md transition disabled:opacity-40"
            >
              {isProcessing ? 'Verifying...' : 'Submit'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
          <span>Works 100% offline without cloud connectivity</span>
          <button onClick={onClose} className="hover:text-white transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
