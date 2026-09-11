import React, { useState } from 'react';
import {
  UserPlus,
  Search,
  CheckCircle2,
  FileText,
  CreditCard,
  Armchair,
  Calendar,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../../db/localDatabase';
import { Admission, PaymentMethod, PaymentTransaction } from '../../types';

interface AdmissionsListProps {
  onNavigate: (screen: string, param?: any) => void;
  onOpenReceipt: (tx: PaymentTransaction) => void;
}

export const AdmissionsListScreen: React.FC<AdmissionsListProps> = ({
  onNavigate,
  onOpenReceipt,
}) => {
  const [search, setSearch] = useState('');

  const filteredAdmissions = db.admissions.filter(a => {
    if (search) {
      const q = search.toLowerCase();
      return (
        a.studentName.toLowerCase().includes(q) ||
        a.admissionNo.toLowerCase().includes(q) ||
        a.studentId.toLowerCase().includes(q) ||
        a.seatNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-5 pb-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700/70 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-cyan-400" />
            Admissions Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete records of student admissions, seat contracts, and transactional receipts
          </p>
        </div>

        <button
          onClick={() => onNavigate('new-admission')}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition"
        >
          <UserPlus className="w-4 h-4" />
          New Admission Wizard
        </button>
      </div>

      {/* Table */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700/70 shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search admission no, student, seat..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {filteredAdmissions.length} Admissions Logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="pb-3">Admission No</th>
                <th className="pb-3">Student Name</th>
                <th className="pb-3">Room & Seat</th>
                <th className="pb-3">Membership Plan</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Fee Paid</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAdmissions.map(adm => {
                const tx = db.payments.find(p => p.receiptNo === adm.receiptNo);
                return (
                  <tr key={adm.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 font-mono font-bold text-cyan-400">
                      {adm.admissionNo}
                    </td>
                    <td className="py-3 font-semibold text-white">
                      {adm.studentName}
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {adm.studentId}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono font-semibold">
                        Seat {adm.seatNumber}
                      </span>
                    </td>
                    <td className="py-3 text-slate-300">{adm.planName}</td>
                    <td className="py-3 text-slate-400">{adm.date}</td>
                    <td className="py-3 font-mono font-bold text-emerald-400">
                      ₹{adm.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {adm.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {tx ? (
                        <button
                          onClick={() => onOpenReceipt(tx)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[11px] font-mono transition"
                        >
                          Print
                        </button>
                      ) : (
                        <span className="text-slate-500 text-[10px]">Logged</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// Screen 17: New Admission Transactional Wizard
// ----------------------------------------------------
interface NewAdmissionProps {
  onNavigate: (screen: string, param?: any) => void;
  onOpenReceipt: (tx: PaymentTransaction) => void;
}

export const NewAdmissionWizardScreen: React.FC<NewAdmissionProps> = ({
  onNavigate,
  onOpenReceipt,
}) => {
  const [step, setStep] = useState(1);

  // Form State
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [dob, setDob] = useState('2001-05-10');
  const [address, setAddress] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [idProofType, setIdProofType] = useState('Aadhaar Card');
  const [idProofNumber, setIdProofNumber] = useState('');

  const [selectedPlanId, setSelectedPlanId] = useState('plan-2');
  const [selectedRoomId, setSelectedRoomId] = useState('room-1');
  const [selectedSeatNumber, setSelectedSeatNumber] = useState('A03');

  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [completedTx, setCompletedTx] = useState<PaymentTransaction | null>(null);

  const currentPlan = db.membershipPlans.find(p => p.id === selectedPlanId) || db.membershipPlans[0];
  const finalAmount = Math.max(0, currentPlan.price - discount);

  // Available seats in chosen room
  const availableSeats = db.seats.filter(
    s => s.roomId === selectedRoomId && s.status === 'AVAILABLE'
  );

  const handleFinishAdmission = () => {
    if (!name || !mobile) {
      alert('Please fill out student name and contact number.');
      return;
    }

    try {
      const { student, admission, payment } = db.newAdmissionTransaction({
        name,
        mobile,
        email: email || `${name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
        gender,
        dob,
        address: address || 'Jaipur, Rajasthan',
        fatherName: fatherName || 'Guardian',
        emergencyContact: emergencyContact || mobile,
        idProofType,
        idProofNumber: idProofNumber || '1234-5678-9012',
        planId: selectedPlanId,
        roomId: selectedRoomId,
        seatNumber: selectedSeatNumber,
        amount: finalAmount,
        discount,
        paymentMethod,
      });

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      setCompletedTx(payment);
      setStep(5); // Completion step
    } catch (e) {
      alert('Failed to complete admission: ' + e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8 animate-in fade-in duration-300">
      {/* Wizard Header */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700/70 shadow-xl flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-cyan-400" />
            New Student Admission Transaction
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Atomic offline registration: Student + Membership + Seat Assignment + Payment Receipt
          </p>
        </div>
        <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-lg border border-cyan-800">
          Step {step} of 4
        </span>
      </div>

      {/* Stepper Progress Bar */}
      <div className="grid grid-cols-4 gap-2">
        {['1. Student Details', '2. Membership Plan', '3. Seat Allocation', '4. Payment & Confirm'].map(
          (label, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition ${
                step === idx + 1
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                  : step > idx + 1
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-900/60 text-slate-500 border-slate-800'
              }`}
            >
              {label}
            </div>
          )
        )}
      </div>

      {/* Step Container */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-700/70 shadow-2xl">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Student Personal & Identity Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Verma"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Mobile Number *</label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. rahul.verma@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Father / Guardian Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sunil Verma"
                  value={fatherName}
                  onChange={e => setFatherName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">ID Proof Type</label>
                <select
                  value={idProofType}
                  onChange={e => setIdProofType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="Aadhaar Card">Aadhaar Card</option>
                  <option value="Voter ID">Voter ID</option>
                  <option value="Driving License">Driving License</option>
                  <option value="College / College ID">College / Institute ID</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">ID Reference Number</label>
                <input
                  type="text"
                  placeholder="e.g. 9876-5432-1098"
                  value={idProofNumber}
                  onChange={e => setIdProofNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setStep(2)}
                disabled={!name || !mobile}
                className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg transition flex items-center gap-1.5 disabled:opacity-40"
              >
                Next: Choose Plan <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Select Membership Subscription Plan
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {db.membershipPlans.map(plan => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    selectedPlanId === plan.id
                      ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-sm">{plan.name}</h3>
                    <span className="font-mono font-bold text-cyan-400 text-sm">
                      ₹{plan.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">{plan.description}</p>
                  <div className="space-y-1 text-[11px] text-slate-400">
                    {plan.benefits.slice(0, 3).map((b, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {b}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                Next: Select Seat <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Room & Desk Allocation
            </h2>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Target Reading Room</label>
                <select
                  value={selectedRoomId}
                  onChange={e => setSelectedRoomId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  {db.rooms.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.floor})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Available Desks in Room</label>
                <select
                  value={selectedSeatNumber}
                  onChange={e => setSelectedSeatNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-cyan-300 font-mono font-bold"
                >
                  {availableSeats.length > 0 ? (
                    availableSeats.map(s => (
                      <option key={s.id} value={s.seatNumber}>
                        Seat {s.seatNumber} ({s.type})
                      </option>
                    ))
                  ) : (
                    <option value="A01">A01 (Auto allocated)</option>
                  )}
                </select>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
              <Armchair className="w-6 h-6 text-cyan-400" />
              <div className="text-xs">
                <span className="text-white font-bold block">Assigned Seat: {selectedSeatNumber}</span>
                <span className="text-slate-400">Desk includes dedicated LED study lamp and surge-protected power port.</span>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                Next: Payment & Finalize <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Fee Collection & Atomic Commit
            </h2>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Student:</span>
                <span className="font-bold text-white">{name} ({mobile})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Plan:</span>
                <span className="font-medium text-white">{currentPlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Seat:</span>
                <span className="font-mono text-cyan-400 font-bold">Seat {selectedSeatNumber}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2 font-bold">
                <span className="text-slate-300">Total Payable:</span>
                <span className="text-base font-mono text-emerald-400">₹{finalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Discount (₹)</label>
                <input
                  type="number"
                  value={discount}
                  onChange={e => setDiscount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                >
                  <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                  <option value="Cash">Cash at Counter</option>
                  <option value="Card">Debit / Credit Card</option>
                  <option value="Bank Transfer">Bank NEFT / IMPS</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(3)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Back
              </button>
              <button
                onClick={handleFinishAdmission}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Complete Admission & Generate Receipt
              </button>
            </div>
          </div>
        )}

        {step === 5 && completedTx && (
          <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Admission Successful!</h2>
              <p className="text-xs text-slate-400 mt-1">
                Seat <b className="text-cyan-400">{selectedSeatNumber}</b> is now locked to <b className="text-white">{name}</b>.
              </p>
              <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                Receipt #{completedTx.receiptNo} generated • Changes queued for cloud sync.
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => onOpenReceipt(completedTx)}
                className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Print Thermal Receipt
              </button>
              <button
                onClick={() => onNavigate('students')}
                className="px-5 py-2 bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-700"
              >
                Go to Students Directory
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
