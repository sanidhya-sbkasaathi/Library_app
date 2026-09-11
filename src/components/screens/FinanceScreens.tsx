import React, { useState } from 'react';
import {
  CreditCard,
  IndianRupee,
  Search,
  Filter,
  Plus,
  Printer,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Receipt,
  PieChart as PieIcon,
  Download,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { db } from '../../db/localDatabase';
import { PaymentMethod, PaymentTransaction } from '../../types';

// ----------------------------------------------------
// Screen 22: Fees Dashboard
// ----------------------------------------------------
interface FeesDashboardProps {
  onNavigate: (screen: string, param?: any) => void;
  onOpenReceipt: (tx: PaymentTransaction) => void;
}

export const FeesDashboardScreen: React.FC<FeesDashboardProps> = ({
  onNavigate,
  onOpenReceipt,
}) => {
  const methodBreakdown = [
    { name: 'UPI', value: 30225, color: '#f59e0b' },
    { name: 'Cash', value: 11700, color: '#3b82f6' },
    { name: 'Card', value: 6825, color: '#a855f7' },
  ];

  const cashflowData = [
    { month: 'Nov', income: 980000, expense: 320000 },
    { month: 'Dec', income: 1150000, expense: 380000 },
    { month: 'Jan', income: 1290000, expense: 410000 },
    { month: 'Feb', income: 1340000, expense: 390000 },
    { month: 'Mar', income: 1420000, expense: 450000 },
    { month: 'Apr', income: 1485000, expense: 430000 },
  ];

  return (
    <div className="space-y-5 pb-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700/70 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-pink-400" />
            Financial & Fees Command Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time local ledger, transactions, receipts, and cash flow analytics
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onNavigate('transactions')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            Transactions Ledger
          </button>
          <button
            onClick={() => onNavigate('collect-payment')}
            className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-pink-500/20 flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            Collect Payment
          </button>
        </div>
      </div>

      {/* 4 Financial Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <span className="text-xs text-slate-400 font-medium">Today's Collection</span>
          <h3 className="text-xl font-extrabold text-white font-mono mt-1">₹ 48,750</h3>
          <span className="text-[10px] text-emerald-400 font-bold">↑ 20% vs yesterday</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <span className="text-xs text-slate-400 font-medium">This Month Total</span>
          <h3 className="text-xl font-extrabold text-white font-mono mt-1">₹ 14,85,000</h3>
          <span className="text-[10px] text-emerald-400 font-bold">↑ 14% vs last month</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <span className="text-xs text-slate-400 font-medium">Pending Student Fees</span>
          <h3 className="text-xl font-extrabold text-amber-400 font-mono mt-1">₹ 65,000</h3>
          <span className="text-[10px] text-slate-400">18 students with balance due</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <span className="text-xs text-slate-400 font-medium">Monthly Net Profit</span>
          <h3 className="text-xl font-extrabold text-emerald-400 font-mono mt-1">₹ 10,55,000</h3>
          <span className="text-[10px] text-slate-400">After all operational expenses</span>
        </div>
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Cash Flow Bars (8 cols) */}
        <div className="md:col-span-8 p-5 rounded-2xl bg-slate-900/90 border border-slate-700/70 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Revenue vs Operational Expense
              </h3>
              <p className="text-xs text-slate-400">6 Months net financial flow</p>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /> Income
              </span>
              <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-full" /> Expense
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashflowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Donut (4 cols) */}
        <div className="md:col-span-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-700/70 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-purple-400" />
              Payment Channels
            </h3>
            <p className="text-xs text-slate-400">Today's collection mode</p>
          </div>

          <div className="h-44 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={methodBreakdown} innerRadius={45} outerRadius={65} dataKey="value">
                  {methodBreakdown.map((m, idx) => (
                    <Cell key={idx} fill={m.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-xs font-bold text-slate-400">Total</span>
              <span className="text-sm font-extrabold text-white">₹48.7K</span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs border-t border-slate-800 pt-3">
            {methodBreakdown.map(m => (
              <div key={m.name} className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                  {m.name}
                </span>
                <span className="font-mono font-bold text-white">₹{m.value.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// Screen 23: Transactions Ledger
// ----------------------------------------------------
export const TransactionsScreen: React.FC<FeesDashboardProps> = ({
  onNavigate,
  onOpenReceipt,
}) => {
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');

  const filtered = db.payments.filter(p => {
    if (methodFilter !== 'ALL' && p.method !== methodFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.receiptNo.toLowerCase().includes(q) ||
        p.studentName.toLowerCase().includes(q) ||
        p.studentId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-5 pb-8 animate-in fade-in duration-300">
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700/70 shadow-xl flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            Immutable Transactions Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident financial records stored locally in SQLite with receipt reprints
          </p>
        </div>

        <button
          onClick={() => onNavigate('collect-payment')}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Collect Fee
        </button>
      </div>

      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700/70 shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search receipt #, student name, ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex gap-1.5">
            {['ALL', 'UPI', 'Cash', 'Card'].map(m => (
              <button
                key={m}
                onClick={() => setMethodFilter(m)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg ${
                  methodFilter === m
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="pb-3">Receipt No</th>
                <th className="pb-3">Student Name</th>
                <th className="pb-3">Particulars</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Method</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Device / Cashier</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 font-mono font-bold text-cyan-400">{p.receiptNo}</td>
                  <td className="py-3 font-semibold text-white">
                    {p.studentName}
                    <span className="text-[10px] text-slate-400 block font-mono">{p.studentId}</span>
                  </td>
                  <td className="py-3 text-slate-300">{p.planName || 'Monthly Fee'}</td>
                  <td className="py-3 font-mono font-bold text-emerald-400">₹{p.amount.toLocaleString('en-IN')}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-medium">
                      {p.method}
                    </span>
                  </td>
                  <td className="py-3 text-slate-400">{p.date}</td>
                  <td className="py-3 text-slate-400 text-[11px]">{p.receivedBy} ({p.deviceId})</td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => onOpenReceipt(p)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-mono transition flex items-center gap-1 ml-auto"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Thermal Receipt
                    </button>
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
// Screen 24: Collect Payment Form
// ----------------------------------------------------
export const CollectPaymentScreen: React.FC<{
  onNavigate: (screen: string) => void;
  onOpenReceipt: (tx: PaymentTransaction) => void;
}> = ({ onNavigate, onOpenReceipt }) => {
  const [selectedStudentId, setSelectedStudentId] = useState(db.students[0].studentId);
  const [amount, setAmount] = useState(1500);
  const [method, setMethod] = useState<PaymentMethod>('UPI');
  const [notes, setNotes] = useState('Monthly membership renewal');

  const student = db.students.find(s => s.studentId === selectedStudentId) || db.students[0];

  const handleSave = () => {
    if (!amount || amount <= 0) {
      alert('Please enter valid amount');
      return;
    }

    const tx = db.collectPaymentTransaction({
      studentId: student.studentId,
      studentName: student.name,
      seatNumber: student.seatNumber,
      planName: student.membershipPlan,
      amount,
      method,
      notes,
    });

    onOpenReceipt(tx);
    onNavigate('transactions');
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-8 animate-in fade-in duration-300">
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700/70 shadow-xl">
        <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-purple-400" />
          Collect Student Payment
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Issue official thermal 80mm receipt with local SQLite commit
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-700/70 shadow-2xl space-y-4 text-xs">
        <div>
          <label className="block text-slate-400 mb-1 font-medium">Select Student</label>
          <select
            value={selectedStudentId}
            onChange={e => setSelectedStudentId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-cyan-500"
          >
            {db.students.map(s => (
              <option key={s.id} value={s.studentId}>
                {s.name} ({s.studentId}) — Seat {s.seatNumber || 'N/A'} • Due: ₹{s.balanceDue}
              </option>
            ))}
          </select>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-400">Student Name:</span>
            <span className="font-bold text-white">{student.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Plan:</span>
            <span className="text-slate-200">{student.membershipPlan}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Assigned Seat:</span>
            <span className="font-mono text-cyan-400 font-bold">Seat {student.seatNumber || 'None'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Outstanding Due:</span>
            <span className="font-mono text-rose-400 font-bold">₹{student.balanceDue}</span>
          </div>
        </div>

        <div>
          <label className="block text-slate-400 mb-1 font-medium">Amount to Collect (₹) *</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-base focus:border-cyan-500"
          />
        </div>

        <div>
          <label className="block text-slate-400 mb-1 font-medium">Payment Mode</label>
          <select
            value={method}
            onChange={e => setMethod(e.target.value as PaymentMethod)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
          >
            <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
            <option value="Cash">Cash at Counter</option>
            <option value="Card">Credit / Debit Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-400 mb-1 font-medium">Transaction Remarks / Notes</label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
          />
        </div>

        <div className="pt-2 flex justify-end gap-3">
          <button
            onClick={() => onNavigate('fees-dashboard')}
            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-bold shadow-lg shadow-purple-600/20 flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            Save & Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
