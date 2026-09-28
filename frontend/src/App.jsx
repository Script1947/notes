import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './api';

import Navbar from './components/Navbar';
import DailyView from './components/DailyView';
import CalendarView from './components/CalendarView';
import SearchView from './components/SearchView';
import SettingsView from './components/SettingsView';
import NoteEditorModal from './components/NoteEditorModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import FilePreviewModal from './components/FilePreviewModal';
import AuthPage from './components/AuthPage';

function MainApp() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { addToast } = useToast();

  const [currentTab, setCurrentTab] = useState('daily');
  const [notes, setNotes] = useState([]);
  const [tags, setTags] = useState([]);
  const [calendarSummary, setCalendarSummary] = useState({});
  const [loadingNotes, setLoadingNotes] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);

  // Modals state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeNoteForEdit, setActiveNoteForEdit] = useState(null);
  const [defaultDateForNewNote, setDefaultDateForNewNote] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [previewFile, setPreviewFile] = useState(null);

  // Fetch all notes, tags, calendar data
  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingNotes(true);
    try {
      const [notesRes, tagsRes, calRes] = await Promise.all([
        api.getNotes(),
        api.getTags(),
        api.getCalendarSummary()
      ]);
      setNotes(notesRes.notes || []);
      setTags(tagsRes.tags || []);
      setCalendarSummary(calRes.summary || {});
    } catch (err) {
      console.error('Failed to load notes data:', err);
      addToast('error', 'Could not load notes. Please refresh.');
    } finally {
      setLoadingNotes(false);
    }
  }, [isAuthenticated, addToast]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  // Global Keyboard Shortcuts (Ctrl+N, Ctrl+F)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Ctrl+N / Cmd+N for New Note
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        openNewNoteModal();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const openNewNoteModal = (date = null) => {
    setActiveNoteForEdit(date ? { date } : null);
    setDefaultDateForNewNote(date);
    setIsEditorOpen(true);
  };

  const openEditNoteModal = (note) => {
    setActiveNoteForEdit(note);
    setIsEditorOpen(true);
  };

  const promptDeleteNote = (note) => {
    setNoteToDelete(note);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!noteToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteNote(noteToDelete.id);
      addToast('success', 'Note deleted successfully.');
      setIsDeleteModalOpen(false);
      setNoteToDelete(null);
      loadData();
    } catch (err) {
      addToast('error', err.message || 'Failed to delete note.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNoteSaved = (savedNote) => {
    loadData();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 text-brand-600 dark:text-brand-400 animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Loading Daily Notes...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onNewNote={() => openNewNoteModal()}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearchFocus={() => setCurrentTab('search')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {loadingNotes && notes.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          </div>
        ) : (
          <>
            {currentTab === 'daily' && (
              <DailyView
                notes={notes}
                tags={tags}
                selectedTag={selectedTag}
                onSelectTag={(t) => setSelectedTag(t)}
                onEditNote={openEditNoteModal}
                onDeleteNote={promptDeleteNote}
                onNewNote={openNewNoteModal}
                onPreviewFile={(f) => setPreviewFile(f)}
              />
            )}

            {currentTab === 'calendar' && (
              <CalendarView
                notes={notes}
                calendarSummary={calendarSummary}
                onEditNote={openEditNoteModal}
                onDeleteNote={promptDeleteNote}
                onNewNote={openNewNoteModal}
                onPreviewFile={(f) => setPreviewFile(f)}
                onTagClick={(t) => {
                  setSelectedTag(t);
                  setCurrentTab('daily');
                }}
              />
            )}

            {currentTab === 'search' && (
              <SearchView
                initialQuery={searchQuery}
                tags={tags}
                onEditNote={openEditNoteModal}
                onDeleteNote={promptDeleteNote}
                onPreviewFile={(f) => setPreviewFile(f)}
                onTagClick={(t) => setSelectedTag(t)}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsView onNotesUpdated={loadData} />
            )}
          </>
        )}
      </main>

      {/* Floating Action Button for Mobile Screens */}
      <div className="fixed bottom-6 right-6 sm:hidden z-40">
        <button
          onClick={() => openNewNoteModal()}
          className="w-14 h-14 rounded-full bg-brand-600 text-white shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          aria-label="New Note"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Modals */}
      <NoteEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setActiveNoteForEdit(null);
        }}
        note={activeNoteForEdit && activeNoteForEdit.id ? activeNoteForEdit : null}
        onSaved={handleNoteSaved}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        title={noteToDelete?.title}
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setNoteToDelete(null);
        }}
      />

      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
