import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  File, 
  Trash2, 
  Save, 
  Pin, 
  Calendar, 
  Tag as TagIcon, 
  Clock, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { api } from '../api';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function NoteEditorModal({ isOpen, onClose, note = null, onSaved }) {
  const { addToast } = useToast();
  
  const isEditing = !!note;
  const draftKey = isEditing ? `daily_notes_draft_${note.id}` : 'daily_notes_draft_new';

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [date, setDate] = useState(getTodayString());
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  // Files state
  const [newFiles, setNewFiles] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Draft state
  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const fileInputRef = useRef(null);

  // Initialize or restore
  useEffect(() => {
    if (!isOpen) return;

    if (note) {
      setTitle(note.title || '');
      setBody(note.body || '');
      setDate(note.date || getTodayString());
      setTags(Array.isArray(note.tags) ? note.tags : []);
      setIsPinned(Boolean(note.is_pinned));
      setExistingAttachments(note.attachments || []);
      setNewFiles([]);
    } else {
      // Check for saved new draft
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          setTitle(parsed.title || '');
          setBody(parsed.body || '');
          setDate(parsed.date || getTodayString());
          setTags(parsed.tags || []);
          setIsPinned(Boolean(parsed.isPinned));
          setDraftSavedAt(new Date(parsed.timestamp));
          addToast('info', 'Restored unsaved draft.');
        } catch (e) {
          console.warn('Failed to parse draft:', e);
        }
      } else {
        setTitle('');
        setBody('');
        setDate(getTodayString());
        setTags([]);
        setIsPinned(false);
        setDraftSavedAt(null);
      }
      setExistingAttachments([]);
      setNewFiles([]);
    }
  }, [isOpen, note]);

  // Auto-save draft to localStorage whenever title, body, date, or tags change
  useEffect(() => {
    if (!isOpen) return;
    
    // Only auto-save if there's actual content
    if (!title && !body && tags.length === 0) return;

    const timer = setTimeout(() => {
      const draftData = {
        title,
        body,
        date,
        tags,
        isPinned,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(draftKey, JSON.stringify(draftData));
      setDraftSavedAt(new Date());
    }, 800);

    return () => clearTimeout(timer);
  }, [title, body, date, tags, isPinned, isOpen, draftKey]);

  // Keyboard shortcut Ctrl+S inside modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, title, body, date, tags, isPinned, newFiles]);

  if (!isOpen) return null;

  // Tag management
  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // File selection & Drag-and-Drop
  const handleFilesChosen = (incomingFiles) => {
    const validFiles = [];
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf', '.txt', '.docx', '.doc', '.md'];

    for (const file of incomingFiles) {
      if (file.size > MAX_FILE_SIZE) {
        addToast('error', `"${file.name}" exceeds 10 MB limit (${formatBytes(file.size)}).`);
        continue;
      }

      const ext = '.' + file.name.split('.').pop().toLowerCase();
      const isAllowed = allowedExts.includes(ext) || file.type.startsWith('image/') || file.type === 'application/pdf';

      if (!isAllowed) {
        addToast('error', `"${file.name}" file type is not supported.`);
        continue;
      }

      // Check if duplicate in newFiles
      if (newFiles.some(f => f.file.name === file.name && f.file.size === file.size)) {
        continue;
      }

      validFiles.push({
        file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
      });
    }

    if (validFiles.length > 0) {
      setNewFiles(prev => [...prev, ...validFiles]);
      addToast('info', `${validFiles.length} file(s) attached.`);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesChosen(Array.from(e.dataTransfer.files));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemoveNewFile = (index) => {
    setNewFiles(prev => {
      const copy = [...prev];
      if (copy[index].preview) {
        URL.revokeObjectURL(copy[index].preview);
      }
      copy.splice(index, 1);
      return copy;
    });
  };

  const handleDeleteExistingAttachment = async (attachmentId) => {
    try {
      await api.deleteAttachment(note.id, attachmentId);
      setExistingAttachments(prev => prev.filter(a => a.id !== attachmentId));
      addToast('success', 'Attachment deleted.');
    } catch (err) {
      addToast('error', err.message || 'Failed to delete attachment.');
    }
  };

  const clearDraft = () => {
    localStorage.removeItem(draftKey);
    setDraftSavedAt(null);
    setTitle('');
    setBody('');
    setDate(getTodayString());
    setTags([]);
    setNewFiles([]);
    addToast('info', 'Draft discarded.');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!title.trim() && !body.trim()) {
      addToast('error', 'Please enter a title or note body.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim() || 'Untitled Note');
      formData.append('body', body.trim());
      formData.append('date', date || getTodayString());
      formData.append('tags', tags.join(', '));
      formData.append('is_pinned', isPinned ? '1' : '0');

      // Append files
      for (const item of newFiles) {
        formData.append('files', item.file);
      }

      let result;
      if (isEditing) {
        result = await api.updateNote(note.id, formData);
        addToast('success', 'Note updated successfully!');
      } else {
        result = await api.createNote(formData);
        addToast('success', 'Note created successfully!');
      }

      // Clear draft upon successful save
      localStorage.removeItem(draftKey);

      onSaved(result.note);
      onClose();
    } catch (err) {
      addToast('error', err.message || 'Failed to save note.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {isEditing ? 'Edit Note' : 'Create New Note'}
            </h2>
            {draftSavedAt && (
              <span className="hidden sm:inline-flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                <Check className="w-3 h-3 text-emerald-500" />
                <span>Auto-saved</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {!isEditing && (title || body) && (
              <button
                type="button"
                onClick={clearDraft}
                className="text-xs text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 px-2 py-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
              >
                Clear draft
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Note Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note Title..."
              autoFocus
              className="w-full text-2xl font-bold bg-transparent border-0 focus:ring-0 focus:outline-none placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Date, Pinned & Tags controls */}
          <div className="flex flex-wrap items-center gap-3 pt-2 pb-1 text-sm border-y border-slate-100 dark:border-slate-800">
            {/* Date picker */}
            <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-medium focus:outline-none text-slate-700 dark:text-slate-200"
              />
            </div>

            {/* Pin note button */}
            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium border transition-colors ${
                isPinned 
                  ? 'bg-brand-50 text-brand-700 border-brand-300 dark:bg-brand-950/60 dark:text-brand-300 dark:border-brand-700' 
                  : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800'
              }`}
            >
              <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-current' : ''}`} />
              <span>{isPinned ? 'Pinned' : 'Pin Note'}</span>
            </button>
          </div>

          {/* Tags management */}
          <div>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300 border border-brand-200 dark:border-brand-800"
                >
                  <TagIcon className="w-3 h-3 opacity-70" />
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-500 ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <TagIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Add tags (press Enter or comma, e.g. Work, Ideas)..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400"
                />
              </div>
              {tagInput.trim() && (
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-xs font-medium rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Add
                </button>
              )}
            </div>
          </div>

          {/* Body Textarea */}
          <div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your note here... (supports paragraphs, bullet points, checklists)"
              rows={8}
              className="w-full bg-transparent resize-y border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400"
            />
          </div>

          {/* Drag & Drop File Upload Area */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Attachments (Images, PDFs, .txt, .docx — Max 10 MB)
            </label>

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                isDragging 
                  ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 scale-[0.99]' 
                  : 'border-slate-300 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-500 bg-slate-50/50 dark:bg-slate-800/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.pdf,.txt,.docx,.doc,.md"
                onChange={(e) => {
                  if (e.target.files) {
                    handleFilesChosen(Array.from(e.target.files));
                    e.target.value = '';
                  }
                }}
                className="hidden"
              />
              <UploadCloud className="w-8 h-8 mx-auto text-brand-600 dark:text-brand-400 mb-2" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Drag and drop files here, or <span className="text-brand-600 dark:text-brand-400 underline">browse</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Images, PDFs, Word & Text docs up to 10 MB each
              </p>
            </div>

            {/* List of Existing Attachments */}
            {existingAttachments.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                  Existing attachments ({existingAttachments.length}):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {existingAttachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex items-center space-x-2 overflow-hidden">
                        {att.mimetype.startsWith('image/') ? (
                          <img src={att.url} alt="" className="w-7 h-7 rounded object-cover shrink-0" />
                        ) : (
                          <FileText className="w-5 h-5 text-brand-500 shrink-0" />
                        )}
                        <span className="text-xs font-medium truncate text-slate-800 dark:text-slate-200">
                          {att.filename}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteExistingAttachment(att.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors shrink-0"
                        title="Delete attachment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* List of Newly Selected Files */}
            {newFiles.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                  New files to upload ({newFiles.length}):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {newFiles.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-xl bg-brand-50/60 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800"
                    >
                      <div className="flex items-center space-x-2 overflow-hidden">
                        {item.preview ? (
                          <img src={item.preview} alt="" className="w-7 h-7 rounded object-cover shrink-0" />
                        ) : item.file.type === 'application/pdf' ? (
                          <FileText className="w-5 h-5 text-rose-500 shrink-0" />
                        ) : (
                          <File className="w-5 h-5 text-brand-500 shrink-0" />
                        )}
                        <div className="truncate">
                          <p className="text-xs font-medium truncate text-slate-800 dark:text-slate-200">
                            {item.file.name}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {formatBytes(item.file.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveNewFile(index)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors shrink-0"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block">
            <span>Shortcut: </span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[11px]">Ctrl+S</kbd>
            <span> to save</span>
          </div>

          <div className="flex items-center space-x-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-md transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Note'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
