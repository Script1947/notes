import React, { useRef, useEffect } from 'react';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Search, 
  Settings, 
  Sun, 
  Moon, 
  BookOpen, 
  LogOut, 
  User, 
  LayoutList 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  onNewNote, 
  searchQuery, 
  setSearchQuery,
  onSearchFocus 
}) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const searchInputRef = useRef(null);

  // Global Ctrl+F / Cmd+F handler to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
        if (currentTab !== 'search') {
          setCurrentTab('search');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTab, setCurrentTab]);

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => setCurrentTab('daily')}
              className="flex items-center space-x-2.5 group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="text-left hidden sm:block">
                <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 block leading-tight">
                  Daily Notes
                </span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Write & Organize
                </span>
              </div>
            </button>
          </div>

          {/* Quick Search Bar */}
          <div className="flex-1 max-w-md mx-2 hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (currentTab !== 'search') setCurrentTab('search');
                }}
                onFocus={() => {
                  if (onSearchFocus) onSearchFocus();
                }}
                placeholder="Search notes, tags, dates... (Ctrl+F)"
                className="w-full pl-10 pr-12 py-2 text-sm bg-slate-100/80 dark:bg-slate-800/80 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-brand-500 dark:focus:border-brand-400 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-200 dark:bg-slate-700/60 rounded">
                  Ctrl+F
                </kbd>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-1.5">
            <button
              onClick={() => setCurrentTab('daily')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                currentTab === 'daily'
                  ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/70 dark:text-brand-300'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
              title="Daily Notes View"
            >
              <LayoutList className="w-4 h-4" />
              <span className="hidden sm:inline">Daily</span>
            </button>

            <button
              onClick={() => setCurrentTab('calendar')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                currentTab === 'calendar'
                  ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/70 dark:text-brand-300'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
              title="Calendar View"
            >
              <CalendarIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Calendar</span>
            </button>

            <button
              onClick={() => setCurrentTab('search')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors md:hidden ${
                currentTab === 'search'
                  ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/70 dark:text-brand-300'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentTab('settings')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                currentTab === 'settings'
                  ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/70 dark:text-brand-300'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
              title="Settings & Export"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* ONE BIG + NEW NOTE BUTTON ALWAYS VISIBLE */}
            <button
              onClick={onNewNote}
              className="ml-2 inline-flex items-center space-x-2 px-3.5 sm:px-4 py-2 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white rounded-2xl text-sm font-bold shadow-md shadow-brand-500/25 hover:shadow-brand-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="Create a new note (Ctrl+N)"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden xs:inline">New Note</span>
            </button>

            {/* User Logout Button */}
            <button
              onClick={logout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ml-1"
              title={`Logged in as ${user?.email || 'User'}. Click to Log out.`}
              aria-label="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
