import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  FileText, 
  Archive, 
  Sun, 
  Moon, 
  Laptop, 
  User, 
  Database, 
  Keyboard, 
  Download, 
  Sparkles, 
  ShieldCheck, 
  LogOut 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api';

export default function SettingsView({ onNotesUpdated }) {
  const { user, logout, refreshUser } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const { addToast } = useToast();

  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const handleExportPdf = async () => {
    setDownloadingPdf(true);
    try {
      await api.downloadExport('pdf');
      addToast('success', 'PDF export downloaded successfully!');
    } catch (err) {
      addToast('error', err.message || 'Failed to download PDF.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleExportZip = async () => {
    setDownloadingZip(true);
    try {
      await api.downloadExport('zip');
      addToast('success', 'Full ZIP backup downloaded successfully!');
    } catch (err) {
      addToast('error', err.message || 'Failed to download ZIP backup.');
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleSeedSamples = async () => {
    setSeeding(true);
    try {
      await api.seedSampleNotes();
      addToast('success', 'Starter sample notes added!');
      if (onNotesUpdated) onNotesUpdated();
      refreshUser();
    } catch (err) {
      addToast('error', err.message || 'Failed to load sample notes.');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-150">
      
      {/* Header */}
      <div className="pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
          <SettingsIcon className="w-7 h-7 text-brand-600 dark:text-brand-400" />
          <span>Settings & Preferences</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Manage your theme, export backups, and view keyboard shortcuts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Appearance Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
              {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Appearance</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Choose your preferred reading theme</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center justify-center space-x-2 p-3.5 rounded-2xl border font-semibold text-sm transition-all ${
                theme === 'light'
                  ? 'border-brand-600 bg-brand-50/50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300 ring-2 ring-brand-500/20'
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Light Mode</span>
            </button>

            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center justify-center space-x-2 p-3.5 rounded-2xl border font-semibold text-sm transition-all ${
                theme === 'dark'
                  ? 'border-brand-600 bg-brand-50/50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300 ring-2 ring-brand-500/20'
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Moon className="w-4 h-4 text-indigo-400" />
              <span>Dark Mode</span>
            </button>
          </div>
        </div>

        {/* Account Information Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Account</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Your profile and private storage</p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Email</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.email || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Name</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.name || 'User'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Total Notes</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.notesCount ?? 0}</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors border border-rose-200/60 dark:border-rose-900/60"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

      </div>

      {/* Export Data Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Export & Backup Notes</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your notes are completely yours. Export them in human-readable or complete backup archive formats.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* PDF Export */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
              <FileText className="w-4 h-4" />
              <span>Export as PDF Document</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Creates a clean, printable document containing all your notes, dates, tags, and attachment references.
            </p>
            <button
              onClick={handleExportPdf}
              disabled={downloadingPdf}
              className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>
          </div>

          {/* ZIP Backup */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center space-x-2 text-brand-600 dark:text-brand-400 font-bold text-sm">
              <Archive className="w-4 h-4" />
              <span>Export Full .ZIP Backup</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Includes full structured JSON, individual Markdown (.md) files for each note, and all uploaded attachments.
            </p>
            <button
              onClick={handleExportZip}
              disabled={downloadingZip}
              className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadingZip ? 'Creating Backup...' : 'Download .ZIP Backup'}</span>
            </button>
          </div>

        </div>

        {/* Re-seed sample notes */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Want to see how notes with tags and attachments look?
          </div>
          <button
            onClick={handleSeedSamples}
            disabled={seeding}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{seeding ? 'Adding...' : 'Load Sample Notes'}</span>
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Reference Sheet */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Keyboard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Keyboard Shortcuts</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Boost your productivity with quick hotkeys</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">New Note</span>
            <kbd className="px-2 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-2xs">
              Ctrl + N
            </kbd>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Save Note</span>
            <kbd className="px-2 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-2xs">
              Ctrl + S
            </kbd>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Focus Search</span>
            <kbd className="px-2 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-2xs">
              Ctrl + F
            </kbd>
          </div>
        </div>
      </div>

    </div>
  );
}
