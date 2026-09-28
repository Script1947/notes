import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function DeleteConfirmModal({ isOpen, title, onConfirm, onCancel, loading = false }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400 mb-4">
          <div className="p-2.5 rounded-full bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Delete Note?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
          Are you sure you want to delete <span className="font-semibold text-slate-900 dark:text-slate-100">"{title || 'this note'}"</span>? All attached files will also be permanently removed.
        </p>

        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{loading ? 'Deleting...' : 'Delete Note'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
