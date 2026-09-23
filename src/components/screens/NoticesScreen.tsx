import React, { useState } from 'react';
import {
  Bell,
  Plus,
  Pin,
  PinOff,
  Trash2,
  Edit,
  Search,
  CheckCircle2,
  Calendar,
  Users,
  Tag,
  AlertCircle,
  X,
  Sparkles,
  Info,
  Layers,
} from 'lucide-react';
import { db } from '../../db/localDatabase';
import { Notice } from '../../types';

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Holiday: {
    bg: 'bg-amber-50 dark:bg-amber-500/15',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-500/30',
  },
  Announcement: {
    bg: 'bg-cyan-50 dark:bg-cyan-500/15',
    text: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-200 dark:border-cyan-500/30',
  },
  Rules: {
    bg: 'bg-rose-50 dark:bg-rose-500/15',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-500/30',
  },
  'Exam Update': {
    bg: 'bg-purple-50 dark:bg-purple-500/15',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-500/30',
  },
  Maintenance: {
    bg: 'bg-blue-50 dark:bg-blue-500/15',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-500/30',
  },
};

export const NoticesScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedAudience, setSelectedAudience] = useState<string>('All');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState<Notice['category']>('Announcement');
  const [formAudience, setFormAudience] = useState<Notice['audience']>('All Students');
  const [formPinned, setFormPinned] = useState(false);

  const notices = db.notices;

  // Filter Notices
  const filteredNotices = notices.filter(n => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || n.category === selectedCategory;
    const matchesAud = selectedAudience === 'All' || n.audience === selectedAudience;
    return matchesSearch && matchesCat && matchesAud;
  });

  // Sort pinned notices first, then newest
  const sortedNotices = [...filteredNotices].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const handleOpenAddModal = () => {
    setFormTitle('');
    setFormContent('');
    setFormCategory('Announcement');
    setFormAudience('All Students');
    setFormPinned(false);
    setEditingNotice(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (notice: Notice) => {
    setEditingNotice(notice);
    setFormTitle(notice.title);
    setFormContent(notice.content);
    setFormCategory(notice.category);
    setFormAudience(notice.audience);
    setFormPinned(notice.pinned);
    setIsAddModalOpen(true);
  };

  const handleSaveNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      alert('Please provide both Title and Content for the notice.');
      return;
    }

    const todayDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    if (editingNotice) {
      const updated: Notice = {
        ...editingNotice,
        title: formTitle.trim(),
        content: formContent.trim(),
        category: formCategory,
        audience: formAudience,
        pinned: formPinned,
      };
      db.updateNotice(updated);
      setFeedback(`✓ Notice "${updated.title}" updated successfully!`);
    } else {
      const created = db.addNotice({
        title: formTitle.trim(),
        content: formContent.trim(),
        category: formCategory,
        audience: formAudience,
        date: todayDate,
        status: 'Active',
        pinned: formPinned,
      });
      setFeedback(`✓ Published notice "${created.title}"!`);
    }

    setIsAddModalOpen(false);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Are you sure you want to remove notice "${title}"?`)) {
      db.deleteNotice(id);
      setFeedback(`Notice "${title}" removed.`);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleTogglePin = (id: string) => {
    db.togglePinNotice(id);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Digital Notice Board
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
              {notices.length} Published • {notices.filter(n => n.pinned).length} Pinned
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Broadcast library rules, exam alerts, holiday notices, and schedule updates to student mobile apps and desk terminals.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold rounded-2xl text-xs shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Notice</span>
        </button>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search notices by title or keywords..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['All', 'Announcement', 'Holiday', 'Rules', 'Exam Update', 'Maintenance'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer text-xs ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Audience Selector */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <span className="text-slate-400 text-[11px] whitespace-nowrap">Audience:</span>
          <select
            value={selectedAudience}
            onChange={e => setSelectedAudience(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
          >
            <option value="All">All Audiences</option>
            <option value="All Students">All Students</option>
            <option value="Staff Only">Staff Only</option>
            <option value="Room A & B">Room A & B</option>
          </select>
        </div>
      </div>

      {/* Notices Grid */}
      {sortedNotices.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <Bell className="w-6 h-6 opacity-60" />
          </div>
          <h3 className="font-bold text-slate-800 dark:text-white text-sm">No Notices Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No notices match your selected filters. Click "+ Add Notice" above to publish your first announcement.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedNotices.map(notice => {
            const catColor = CATEGORY_COLORS[notice.category] || CATEGORY_COLORS['Announcement'];

            return (
              <div
                key={notice.id}
                className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition flex flex-col justify-between gap-4 shadow-sm hover:shadow-md relative ${
                  notice.pinned
                    ? 'border-amber-400/80 dark:border-amber-500/60 ring-1 ring-amber-400/30'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                {/* Pinned Marker */}
                {notice.pinned && (
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1 text-[10px] font-bold">
                    <Pin className="w-3 h-3 text-amber-500" />
                    <span>PINNED</span>
                  </div>
                )}

                {/* Top Details */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 flex-wrap pr-16">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${catColor.bg} ${catColor.text} ${catColor.border}`}
                    >
                      {notice.category}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3" />
                      {notice.date}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">
                    {notice.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {notice.content}
                  </p>
                </div>

                {/* Card Footer & Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{notice.audience}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleTogglePin(notice.id)}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        notice.pinned
                          ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                          : 'text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title={notice.pinned ? 'Unpin from Top' : 'Pin to Top'}
                    >
                      {notice.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(notice)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="Edit Notice"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(notice.id, notice.title)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Delete Notice"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT NOTICE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {editingNotice ? 'Edit Digital Notice' : 'Publish New Digital Notice'}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Broadcasted to connected student mobile apps and reception monitors
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNotice} className="space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Notice Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Extended Operating Hours During UPSC Mains Examination"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              {/* Category & Audience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="Announcement">Announcement</option>
                    <option value="Holiday">Holiday</option>
                    <option value="Rules">Rules & Discipline</option>
                    <option value="Exam Update">Exam Update</option>
                    <option value="Maintenance">Maintenance & Wi-Fi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Target Audience
                  </label>
                  <select
                    value={formAudience}
                    onChange={e => setFormAudience(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="All Students">All Students</option>
                    <option value="Staff Only">Staff Only</option>
                    <option value="Room A & B">Room A & B</option>
                  </select>
                </div>
              </div>

              {/* Notice Content */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Notice Content / Announcement Body *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Type the full message or details to display on the library notice board..."
                  value={formContent}
                  onChange={e => setFormContent(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 leading-relaxed"
                />
              </div>

              {/* Pin to Top Checkbox */}
              <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pin className="w-4 h-4 text-amber-500" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Pin to Top of Notice Board
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formPinned}
                  onChange={e => setFormPinned(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold rounded-xl shadow-md shadow-amber-500/20 flex items-center gap-2 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{editingNotice ? 'Save Changes' : 'Publish Notice'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
