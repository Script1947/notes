import React from 'react';
import { X, ExternalLink, Download, FileText, Image as ImageIcon, File } from 'lucide-react';

export default function FilePreviewModal({ file, onClose }) {
  if (!file) return null;

  const isImage = file.mimetype && file.mimetype.startsWith('image/');
  const isPdf = file.mimetype === 'application/pdf';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3 overflow-hidden">
            {isImage ? (
              <ImageIcon className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" />
            ) : isPdf ? (
              <FileText className="w-5 h-5 text-rose-500 shrink-0" />
            ) : (
              <File className="w-5 h-5 text-slate-500 shrink-0" />
            )}
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
              {file.filename}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <a
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href={file.url}
              download={file.filename}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Download file"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-50 dark:bg-slate-950/50 min-h-[300px]">
          {isImage ? (
            <img
              src={file.url}
              alt={file.filename}
              className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-sm"
            />
          ) : isPdf ? (
            <iframe
              src={file.url}
              title={file.filename}
              className="w-full h-[65vh] rounded-lg border border-slate-200 dark:border-slate-800"
            />
          ) : (
            <div className="text-center p-8">
              <File className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">
                {file.filename}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Preview not available for this document type. You can download or view it in an external app.
              </p>
              <a
                href={file.url}
                download={file.filename}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium shadow transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Document</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
