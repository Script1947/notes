import React from 'react';
import { Plus, Calendar, Tag as TagIcon, Sparkles } from 'lucide-react';
import NoteCard from './NoteCard';

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getYesterdayString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatGroupDate(dateStr) {
  const today = getTodayString();
  const yesterday = getYesterdayString();

  if (dateStr === today) {
    return 'Today';
  } else if (dateStr === yesterday) {
    return 'Yesterday';
  }

  // Parse YYYY-MM-DD
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
  return dateStr;
}

export default function DailyView({ 
  notes, 
  tags, 
  selectedTag, 
  onSelectTag, 
  onEditNote, 
  onDeleteNote, 
  onNewNote, 
  onPreviewFile 
}) {
  const todayStr = getTodayString();

  // Filter by selectedTag if active
  const filteredNotes = selectedTag
    ? notes.filter(n => n.tags && n.tags.includes(selectedTag))
    : notes;

  // Group notes by date
  const groupedByDate = filteredNotes.reduce((acc, note) => {
    const d = note.date || todayStr;
    if (!acc[d]) acc[d] = [];
    acc[d].push(note);
    return acc;
  }, {});

  // Sort dates descending, ensuring today is first if present
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
    if (a === todayStr) return -1;
    if (b === todayStr) return 1;
    return b.localeCompare(a);
  });

  const todayNotes = groupedByDate[todayStr] || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      
      {/* Top Banner / Tags quick filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Daily Notes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Organized chronologically with today's notes first.
          </p>
        </div>

        {/* Tag pills */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto py-1 max-w-xl">
            <button
              onClick={() => onSelectTag(null)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                !selectedTag
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300'
              }`}
            >
              All Notes ({notes.length})
            </button>
            {tags.slice(0, 8).map((t) => (
              <button
                key={t.name}
                onClick={() => onSelectTag(selectedTag === t.name ? null : t.name)}
                className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors ${
                  selectedTag === t.name
                    ? 'bg-brand-600 text-white dark:bg-brand-500'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300'
                }`}
              >
                <TagIcon className="w-2.5 h-2.5 opacity-60" />
                <span>{t.name}</span>
                <span className="opacity-60 text-[10px]">({t.count})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TODAY'S NOTES SECTION (ALWAYS HIGHLIGHTED & SHOWN FIRST) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Today
            </h2>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              ({new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })})
            </span>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
              {todayNotes.length} {todayNotes.length === 1 ? 'note' : 'notes'}
            </span>
          </div>

          <button
            onClick={() => onNewNote(todayStr)}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add to Today</span>
          </button>
        </div>

        {todayNotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={onEditNote}
                onDelete={onDeleteNote}
                onPreviewFile={onPreviewFile}
                onTagClick={onSelectTag}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center bg-slate-50/50 dark:bg-slate-900/30">
            <Sparkles className="w-8 h-8 text-brand-500 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No notes written for today yet
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Start your day by jotting down thoughts, priorities, or attaching files.
            </p>
            <button
              onClick={() => onNewNote(todayStr)}
              className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Write Today's Note</span>
            </button>
          </div>
        )}
      </section>

      {/* EARLIER / RECENT NOTES GROUPED BY DATE */}
      {sortedDates.filter(d => d !== todayStr).map((dateKey) => {
        const groupNotes = groupedByDate[dateKey] || [];
        const label = formatGroupDate(dateKey);

        return (
          <section key={dateKey} className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                {label}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                ({dateKey})
              </span>
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {groupNotes.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={onEditNote}
                  onDelete={onDeleteNote}
                  onPreviewFile={onPreviewFile}
                  onTagClick={onSelectTag}
                />
              ))}
            </div>
          </section>
        );
      })}

      {/* Global empty state if no notes exist anywhere */}
      {notes.length === 0 && (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <Calendar className="w-12 h-12 text-brand-500 mx-auto mb-3 opacity-80" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
            Your notebook is empty
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
            Click the "+ New Note" button to write your first entry, attach documents, and organize your daily work!
          </p>
          <button
            onClick={() => onNewNote(todayStr)}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-sm font-bold shadow-md shadow-brand-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Note</span>
          </button>
        </div>
      )}
    </div>
  );
}
