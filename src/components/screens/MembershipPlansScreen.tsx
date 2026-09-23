import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Sparkles,
  Clock,
  Tag,
  ShieldCheck,
  Armchair,
  Check,
  X,
  Copy,
} from 'lucide-react';
import { db } from '../../db/localDatabase';
import { MembershipPlan } from '../../types';

interface MembershipPlansScreenProps {
  onNavigate?: (screen: string, param?: any) => void;
}

export const MembershipPlansScreen: React.FC<MembershipPlansScreenProps> = ({ onNavigate }) => {
  const plans = db.membershipPlans;
  const [isCreating, setIsCreating] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);

  // Form state for custom plan designer
  const [name, setName] = useState('');
  const [durationMonths, setDurationMonths] = useState(1);
  const [price, setPrice] = useState(1000);
  const [discount, setDiscount] = useState(0);
  const [description, setDescription] = useState('');
  const [seatType, setSeatType] = useState('Standard Desk');
  const [benefitInput, setBenefitInput] = useState('');
  const [benefits, setBenefits] = useState<string[]>([
    'High Speed Wi-Fi',
    'Dedicated Power Port',
    'AC Silent Zone',
  ]);

  const handleOpenCreate = () => {
    setName('');
    setDurationMonths(1);
    setPrice(1200);
    setDiscount(0);
    setDescription('Custom designed study plan tailored for flexible student hours.');
    setSeatType('Standard Desk');
    setBenefits(['12 Hours Access', 'High Speed Wi-Fi', 'Filtered Drinking Water', 'Charging Socket']);
    setEditingPlan(null);
    setIsCreating(true);
  };

  const handleAddBenefit = () => {
    if (!benefitInput.trim()) return;
    if (!benefits.includes(benefitInput.trim())) {
      setBenefits([...benefits, benefitInput.trim()]);
    }
    setBenefitInput('');
  };

  const handleRemoveBenefit = (b: string) => {
    setBenefits(benefits.filter(item => item !== b));
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a plan name.');
      return;
    }

    try {
      await db.addMembershipPlan({
        name: name.trim(),
        durationMonths: Number(durationMonths) || 1,
        price: Number(price) || 0,
        discount: Number(discount) || 0,
        description: description.trim() || 'Custom membership plan',
        seatType,
        benefits,
        active: true,
      });

      setIsCreating(false);
    } catch (err: any) {
      alert('Failed to save plan: ' + err.message);
    }
  };

  const handleDeletePlan = async (id: string, planName: string) => {
    if (confirm(`Are you sure you want to delete "${planName}"?`)) {
      await db.deleteMembershipPlan(id);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Membership Plans & Custom Designer
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
              {plans.length} Active Plans
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Standard pricing tiers, duration quotas, custom shifts, and tailor-made student subscription plans
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-2xl text-xs shadow-md shadow-cyan-500/20 transition flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>+ Design Custom Plan</span>
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {plans.map(plan => (
          <div
            key={plan.id}
            className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20">
                    {plan.durationMonths === 1 ? '1 Month' : `${plan.durationMonths} Months`}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {plan.name}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-lg font-extrabold text-cyan-600 dark:text-cyan-400 font-mono">
                    ₹{plan.price.toLocaleString('en-IN')}
                  </span>
                  {plan.discount > 0 && (
                    <span className="block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {plan.discount}% off regular
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {plan.description}
              </p>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                  <Armchair className="w-3.5 h-3.5 text-blue-500" />
                  <span>{plan.seatType || 'Standard Desk'}</span>
                </div>
                <div className="space-y-1 pt-1">
                  {plan.benefits.map((b, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-mono text-slate-400">
                Plan ID: {plan.id}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleDeletePlan(plan.id, plan.name)}
                  className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
                  title="Delete Plan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Custom Plan Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h2 className="font-bold text-base text-slate-900 dark:text-white">
                  Design Custom Membership Plan
                </h2>
              </div>
              <button
                onClick={() => setIsCreating(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-400 font-semibold">Plan Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekend Special 12-Hour Shift"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Duration (Months)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={durationMonths}
                    onChange={e => setDurationMonths(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={price}
                    onChange={e => setPrice(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discount}
                    onChange={e => setDiscount(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-400 font-semibold">Seat / Shift Type</label>
                <select
                  value={seatType}
                  onChange={e => setSeatType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="Standard Desk">Standard Desk (General Reading Hall)</option>
                  <option value="Cushioned Ergonomic">Cushioned Ergonomic (AC Zone)</option>
                  <option value="Premium Fixed Cubicle">Premium Fixed Cubicle (24x7 Dedicated)</option>
                  <option value="Executive Study Pod">Executive Study Pod (VIP Aspirant)</option>
                  <option value="Morning Shift (6AM - 2PM)">Morning Shift (6AM - 2PM)</option>
                  <option value="Evening Shift (2PM - 10PM)">Evening Shift (2PM - 10PM)</option>
                  <option value="Night Owl Pass (10PM - 6AM)">Night Owl Pass (10PM - 6AM)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-400 font-semibold">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              {/* Benefits tag builder */}
              <div className="space-y-2">
                <label className="block text-slate-600 dark:text-slate-400 font-semibold">Benefits & Amenities</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Free Locker / 24x7 Tea"
                    value={benefitInput}
                    onChange={e => setBenefitInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddBenefit();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddBenefit}
                    className="px-3 py-1.5 rounded-xl bg-cyan-600 text-white font-bold text-xs"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {benefits.map(b => (
                    <span
                      key={b}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px] flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                    >
                      <Check className="w-3 h-3 text-emerald-500" />
                      {b}
                      <button
                        type="button"
                        onClick={() => handleRemoveBenefit(b)}
                        className="text-slate-400 hover:text-rose-500 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-md"
                >
                  Save & Publish Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
