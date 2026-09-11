import React, { useState } from 'react';
import { Printer, Download, X, CheckCircle, QrCode } from 'lucide-react';
import { PaymentTransaction } from '../../types';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: PaymentTransaction | null;
  associationName?: string;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
  associationName = 'Knowledge Library (Main Campus)',
}) => {
  const [printFormat, setPrintFormat] = useState<'thermal' | 'a4'>('thermal');

  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Receipt Preview & Thermal Printing</h3>
              <p className="text-xs text-slate-400">Offline-ready local receipt generator</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-800/80 rounded-lg p-0.5 border border-slate-700">
              <button
                onClick={() => setPrintFormat('thermal')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  printFormat === 'thermal'
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Thermal (80mm)
              </button>
              <button
                onClick={() => setPrintFormat('a4')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  printFormat === 'a4'
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                A4 Invoice
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Receipt Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/50 flex justify-center items-center">
          {printFormat === 'thermal' ? (
            /* Thermal 80mm Format */
            <div className="printable-receipt w-[320px] bg-white text-slate-900 font-mono p-5 rounded-lg shadow-xl text-xs border border-slate-300">
              <div className="text-center border-b border-dashed border-slate-400 pb-3 mb-3">
                <h2 className="font-bold text-sm tracking-wider uppercase">{associationName}</h2>
                <p className="text-[11px] text-slate-600">SMART READING & STUDY CENTER</p>
                <p className="text-[10px] text-slate-500">GST: 08AAAAA0000A1Z5 • Jaipur</p>
                <p className="text-[10px] text-slate-500">Tel: +91 98765 43210</p>
              </div>

              <div className="space-y-1 mb-3 text-[11px] border-b border-dashed border-slate-400 pb-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Receipt No:</span>
                  <span className="font-bold text-slate-900">{transaction.receiptNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date/Time:</span>
                  <span>{transaction.date} 10:30 AM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Device ID:</span>
                  <span>{transaction.deviceId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cashier:</span>
                  <span>{transaction.receivedBy}</span>
                </div>
              </div>

              <div className="space-y-1 mb-3 text-[11px] border-b border-dashed border-slate-400 pb-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student ID:</span>
                  <span className="font-bold">{transaction.studentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Student Name:</span>
                  <span className="font-bold">{transaction.studentName}</span>
                </div>
                {transaction.seatNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Seat Allocated:</span>
                    <span className="font-bold bg-slate-100 px-1 rounded">Seat {transaction.seatNumber}</span>
                  </div>
                )}
                {transaction.planName && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Membership:</span>
                    <span>{transaction.planName}</span>
                  </div>
                )}
              </div>

              {/* Itemized Table */}
              <div className="mb-3 text-[11px]">
                <div className="flex justify-between font-bold border-b border-slate-300 pb-1 mb-1">
                  <span>Particulars</span>
                  <span>Amount</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span>Library Membership Fee</span>
                  <span>₹{transaction.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-0.5 text-slate-500">
                  <span>Locker / Facility Charge</span>
                  <span>₹0.00</span>
                </div>
                <div className="flex justify-between font-bold text-xs border-t border-slate-400 pt-1 mt-2">
                  <span>NET PAID ({transaction.method})</span>
                  <span>₹{transaction.amount.toLocaleString('en-IN')}.00</span>
                </div>
              </div>

              {/* QR Code and Footer */}
              <div className="text-center pt-2 border-t border-dashed border-slate-400">
                <div className="inline-flex flex-col items-center justify-center p-2 bg-slate-100 rounded-md mb-2">
                  <QrCode className="w-12 h-12 text-slate-800" />
                  <span className="text-[9px] text-slate-500 mt-0.5">{transaction.receiptNo}</span>
                </div>
                <p className="text-[10px] font-semibold text-slate-700">Thank you for studying with us!</p>
                <p className="text-[9px] text-slate-400">Keep receipt safe for seat verification</p>
                <p className="text-[8px] text-slate-400 mt-1">*** System Generated Offline Receipt ***</p>
              </div>
            </div>
          ) : (
            /* A4 Format Preview */
            <div className="printable-receipt w-full max-w-xl bg-white text-slate-900 p-8 rounded-xl shadow-xl text-sm border border-slate-200">
              <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
                <div>
                  <h1 className="text-xl font-bold text-blue-900">{associationName}</h1>
                  <p className="text-xs text-slate-500 mt-1">Universal Study Center & Reading Library</p>
                  <p className="text-xs text-slate-500">Plot 42, Knowledge Corridor, Near Metro Gate 3</p>
                  <p className="text-xs text-slate-500">GST: 08AAAAA0000A1Z5 | contact@knowledgelibrary.com</p>
                </div>
                <div className="text-right">
                  <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-xs mb-2">
                    PAID INVOICE
                  </div>
                  <h3 className="text-sm font-mono font-bold text-slate-800">#{transaction.receiptNo}</h3>
                  <p className="text-xs text-slate-500">Date: {transaction.date}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 rounded-lg text-xs">
                <div>
                  <span className="text-slate-400 uppercase tracking-wider block font-semibold mb-1">Student Details</span>
                  <p className="font-bold text-sm text-slate-800">{transaction.studentName}</p>
                  <p className="text-slate-600">Student ID: {transaction.studentId}</p>
                  <p className="text-slate-600">Seat Number: {transaction.seatNumber || 'Standard Allocation'}</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase tracking-wider block font-semibold mb-1">Payment Details</span>
                  <p className="font-bold text-slate-800">Method: {transaction.method}</p>
                  <p className="text-slate-600">Status: Completed (Local Confirmed)</p>
                  <p className="text-slate-600">Issued by: {transaction.receivedBy}</p>
                </div>
              </div>

              <table className="w-full text-xs text-left mb-6 border border-slate-200 rounded">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Description</th>
                    <th className="p-2.5">Plan / Duration</th>
                    <th className="p-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="p-2.5 font-medium">Library Membership Subscription</td>
                    <td className="p-2.5 text-slate-600">{transaction.planName || 'Regular Plan'}</td>
                    <td className="p-2.5 text-right font-mono font-bold">₹{transaction.amount.toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-between items-center border-t border-slate-200 pt-4">
                <div className="text-xs text-slate-500">
                  <p>Authorized Signature: __________________</p>
                  <p className="text-[10px] mt-1 text-slate-400">Printed on: {new Date().toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Total Amount Paid</span>
                  <span className="text-xl font-bold text-blue-900 font-mono">₹{transaction.amount.toLocaleString('en-IN')}.00</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between no-print">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            Verified immutable transaction record
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-lg shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition"
            >
              <Printer className="w-4 h-4" />
              Print ({printFormat === 'thermal' ? 'Thermal 80mm' : 'A4'})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
