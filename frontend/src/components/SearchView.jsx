import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Tag as TagIcon, 
  Calendar, 
  X, 
  Filter, 
  RotateCcw, 
  FileQuestion 
} from 'lucide-react';
import NoteCard from './NoteCard';
import { api } from '../api';

export default function SearchView({
  initialQuery = '',
  tags = [],
  onEditNote,
  onDeleteNote,
  onPreviewFile,
  onTagClick
}) {
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [selectedTag, setSelectedTag] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Synchronize when initialQuery changes from top navbar
  useEffect(() => {
    if (initialQuery !== undefined) {
      setSearchTerm(initialQuery);
    }
  }, [initialQuery]);

  // Execute search whenever filters change
  useEffect(() => {
    let isCancelled = false;

    const performSearch = async () => {
      setLoading(true);
      try {
        const data = await api.getNotes({
          search: searchTerm,
          tag: selectedTag,
          startDate,
          endDate
        });
        if (!isCancelled) {
          setResults(data.notes || []);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 200);

    return () => {
      isCancelled = true;
      clearTimeout(debounceTimer);
    };
  }, [searchTerm, selectedTag, startDate, endDate]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedTag('');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = Boolean(searchTerm || selectedTag || startDate || endDate);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Title */}
      <div className="pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
          <Search className="w-7 h-7 text-brand-600 dark:text-brand-400" />
          <span>Search & Filter Notes</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Find notes by keyword, tag, or across specific date ranges.
        </p>
      </div>

      {/* Filter controls panel */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        
        {/* Keyword Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by keywords in title, body, or attached file names..."
            className="w-full pl-12 pr-10 py-3 text-sm sm:text-base bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-3.5 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Second Row: Tag Filter & Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          
          {/* Tag selector */}
          <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700">
            <TagIcon className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-medium w-full focus:outline-none text-slate-800 dark:text-slate-200"
            >
              <option value="" className="dark:bg-slate-900">All Tags</option>
              {tags.map((t) => (
                <option key={t.name} value={t.name} className="dark:bg-slate-900">
                  {t.name} ({t.count})
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="flex flex-col flex-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">From Date</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-xs font-semibold focus:outline-none text-slate-800 dark:text-slate-200"
              />
            </div>
            {startDate && (
              <button onClick={() => setStartDate('')} className="text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* End Date */}
          <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="flex flex-col flex-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">To Date</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-xs font-semibold focus:outline-none text-slate-800 dark:text-slate-200"
              />
            </div>
            {endDate && (
              <button onClick={() => setEndDate('')} className="text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>

        {/* Clear filters action */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Showing filtered results
            </span>
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center space-x-1 text-brand-600 hover:text-brand-700 dark:text-brand-400 font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset all filters</span>
            </button>
          </div>
        )}

      </div>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 px-1">
          <span>
            {loading ? 'Searching...' : `Found ${results.length} ${results.length === 1 ? 'note' : 'notes'}`}
          </span>
        </div>

        {results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={onEditNote}
                onDelete={onDeleteNote}
                onPreviewFile={onPreviewFile}
                onTagClick={(t) => setSelectedTag(t)}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
            <FileQuestion className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
              No matching notes found
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
              Try modifying your keyword, selecting a different tag, or widening the date range.
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
