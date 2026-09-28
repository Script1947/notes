import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Plus, 
  FileText 
} from 'lucide-react';
import NoteCard from './NoteCard';

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function formatDateString(year, month, day) {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export default function CalendarView({
  notes,
  calendarSummary = {},
  onEditNote,
  onDeleteNote,
  onNewNote,
  onPreviewFile,
  onTagClick
}) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(
    formatDateString(today.getFullYear(), today.getMonth(), today.getDate())
  );

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(formatDateString(today.getFullYear(), today.getMonth(), today.getDate()));
  };

  // Notes for selected date
  const selectedDayNotes = notes.filter((n) => n.date === selectedDate);

  // Selected date human readable string
  const selectedDateFormatted = (() => {
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    }
    return selectedDate;
  })();

  const todayStr = formatDateString(today.getFullYear(), today.getMonth(), today.getDate());

  // Generate calendar grid cells
  const blanks = Array.from({ length: firstDay }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <CalendarIcon className="w-7 h-7 text-brand-600 dark:text-brand-400" />
            <span>Calendar</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Select any date to see that day's notes or create a new entry.
          </p>
        </div>

        {/* Month selector & Today button */}
        <div className="flex items-center space-x-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Today
          </button>
          <div className="flex items-center space-x-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-sm">
            <button
              onClick={prevMonth}
              className="p-1 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Previous month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-3 text-sm font-bold text-slate-800 dark:text-slate-200 min-w-[130px] text-center">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button
              onClick={nextMonth}
              className="p-1 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Next month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Calendar on Left, Selected Day's Notes on Right (or stacked on mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Calendar Card */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          {/* Day of Week headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Month days */}
          <div className="grid grid-cols-7 gap-2">
            {blanks.map((b) => (
              <div key={`blank-${b}`} className="aspect-square" />
            ))}

            {days.map((day) => {
              const dateStr = formatDateString(currentYear, currentMonth, day);
              const isSelected = selectedDate === dateStr;
              const isToday = todayStr === dateStr;
              const count = calendarSummary[dateStr] || 0;

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => setSelectedDate(dateStr)}
                  className={`aspect-square relative rounded-2xl flex flex-col items-center justify-center transition-all p-1 ${
                    isSelected
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30 scale-105 z-10'
                      : isToday
                      ? 'border-2 border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-50/40 dark:bg-brand-950/30 font-bold'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="text-sm font-semibold">{day}</span>
                  
                  {/* Note Count Badge */}
                  {count > 0 && (
                    <div className="mt-1 flex items-center justify-center">
                      {count === 1 ? (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? 'bg-white' : 'bg-brand-600 dark:bg-brand-400'
                          }`}
                        />
                      ) : (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full leading-tight ${
                            isSelected
                              ? 'bg-white/30 text-white'
                              : 'bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800'
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Details Panel */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                {selectedDate === todayStr ? 'Today' : 'Selected Date'}
              </p>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {selectedDateFormatted}
              </h3>
            </div>

            <button
              onClick={() => onNewNote(selectedDate)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Note</span>
            </button>
          </div>

          {/* List of notes for this day */}
          {selectedDayNotes.length > 0 ? (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {selectedDayNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={onEditNote}
                  onDelete={onDeleteNote}
                  onPreviewFile={onPreviewFile}
                  onTagClick={onTagClick}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                No notes for this date
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto mb-4">
                Keep a log of this day's accomplishments, meetings, or thoughts.
              </p>
              <button
                onClick={() => onNewNote(selectedDate)}
                className="inline-flex items-center space-x-2 px-4 py-2 border border-brand-500 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/50 rounded-xl text-xs font-bold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create note for {selectedDate}</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
