import React from 'react';
import { 
  Calendar, 
  Tag as TagIcon, 
  Paperclip, 
  Edit3, 
  Trash2, 
  Pin, 
  FileText, 
  Image as ImageIcon, 
  File, 
  ExternalLink 
} from 'lucide-react';

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function NoteCard({ note, onEdit, onDelete, onPreviewFile, onTagClick }) {
  const isPinned = Boolean(note.is_pinned);

  return (
    <div className={`group relative bg-white dark:bg-slate-900 rounded-2xl p-5 border transition-all duration-200 hover:shadow-lg ${
      isPinned 
        ? 'border-brand-300 dark:border-brand-700/60 shadow-sm bg-gradient-to-b from-brand-50/20 to-white dark:from-brand-950/20 dark:to-slate-900' 
        : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
    }`}>
      {/* Top row: Date & Actions */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center space-x-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <Calendar className="w-3.5 h-3.5" />
          <span>{note.date}</span>
          {isPinned && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/80 px-2 py-0.5 rounded-full border border-brand-200 dark:border-brand-800">
              <Pin className="w-3 h-3 fill-current" /> Pinned
            </span>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center space-x-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(note)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Edit note"
            aria-label="Edit note"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(note)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
            title="Delete note"
            aria-label="Delete note"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Note Title */}
      <h3 
        onClick={() => onEdit(note)}
        className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 cursor-pointer hover:text-brand-600 dark:hover:text-brand-400 transition-colors leading-snug"
      >
        {note.title || 'Untitled Note'}
      </h3>

      {/* Note Body */}
      {note.body && (
        <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line line-clamp-4 leading-relaxed mb-4">
          {note.body}
        </p>
      )}

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3.5">
          {note.tags.map((tag, idx) => (
            <button
              key={idx}
              onClick={() => onTagClick && onTagClick(tag)}
              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-md bg-slate-100 hover:bg-brand-50 text-slate-600 hover:text-brand-700 dark:bg-slate-800 dark:hover:bg-brand-950/60 dark:text-slate-300 dark:hover:text-brand-300 border border-slate-200/60 dark:border-slate-700/60 transition-colors"
            >
              <TagIcon className="w-2.5 h-2.5 opacity-60" />
              <span>{tag}</span>
            </button>
          ))}
        </div>
      )}

      {/* Attachments list with previews */}
      {note.attachments && note.attachments.length > 0 && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
            <Paperclip className="w-3.5 h-3.5" />
            <span>{note.attachments.length} {note.attachments.length === 1 ? 'Attachment' : 'Attachments'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {note.attachments.map((att) => {
              const isImg = att.mimetype && att.mimetype.startsWith('image/');
              const isPdf = att.mimetype === 'application/pdf';

              return (
                <div
                  key={att.id}
                  onClick={() => onPreviewFile(att)}
                  className="flex items-center space-x-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 cursor-pointer transition-colors group/att"
                >
                  {isImg ? (
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 border border-slate-300 dark:border-slate-600">
                      <img
                        src={att.url}
                        alt={att.filename}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : isPdf ? (
                    <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-900">
                      <FileText className="w-4 h-4 text-rose-500" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-950/60 flex items-center justify-center shrink-0 border border-brand-200 dark:border-brand-900">
                      <File className="w-4 h-4 text-brand-500" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate group-hover/att:text-brand-600 dark:group-hover/att:text-brand-400">
                      {att.filename}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {formatBytes(att.size)}
                    </p>
                  </div>

                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover/att:opacity-100 transition-opacity shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
