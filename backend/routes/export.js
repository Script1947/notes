const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const archiver = require('archiver');
const { db, formatDate } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { uploadsDir } = require('../upload');

router.use(authenticateToken);

/**
 * Format bytes to readable size
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Clean string for safe file names
 */
function sanitizeFileName(str) {
  return str.replace(/[^a-zA-Z0-9_\-\. ]/g, '_').substring(0, 50);
}

/**
 * GET /api/export/pdf
 * Export all notes for the authenticated user as a formatted PDF
 */
router.get('/pdf', (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    const notes = db.prepare(`
      SELECT * FROM notes 
      WHERE user_id = ? 
      ORDER BY date DESC, created_at DESC
    `).all(userId);

    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: 'Daily Notes Export',
        Author: userEmail,
        CreationDate: new Date()
      }
    });

    const filename = `daily-notes-${formatDate(new Date())}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Title / Cover
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#1e293b').text('Daily Notes', { align: 'left' });
    doc.fontSize(10).font('Helvetica').fillColor('#64748b').text(`User: ${userEmail}  |  Export Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}  |  Total Notes: ${notes.length}`);
    doc.moveDown(1);
    doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1.5);

    if (notes.length === 0) {
      doc.fontSize(12).fillColor('#64748b').text('No notes found in this account.');
      doc.end();
      return;
    }

    notes.forEach((note, index) => {
      // Check if we need page break
      if (doc.y > 680) {
        doc.addPage();
      }

      // Note Header
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#0f172a').text(note.title || 'Untitled Note');
      
      const tagText = note.tags ? `  •  Tags: ${note.tags}` : '';
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#3b82f6').text(`Date: ${note.date}${tagText}`);
      doc.moveDown(0.5);

      // Body text
      doc.fontSize(11).font('Helvetica').fillColor('#334155').text(note.body || '(No content)', {
        align: 'left',
        lineGap: 3
      });

      // Fetch attachments
      const attachments = db.prepare('SELECT filename, size FROM attachments WHERE note_id = ?').all(note.id);
      if (attachments && attachments.length > 0) {
        doc.moveDown(0.5);
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#475569').text('Attachments:');
        for (const att of attachments) {
          doc.fontSize(9).font('Helvetica').fillColor('#64748b').text(`  📎 ${att.filename} (${formatBytes(att.size)})`);
        }
      }

      doc.moveDown(1.2);
      if (index < notes.length - 1) {
        doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(1.2);
      }
    });

    doc.end();
  } catch (err) {
    console.error('PDF export error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate PDF.' });
    }
  }
});

/**
 * GET /api/export/zip
 * Export all notes as a complete ZIP backup containing Markdown files, JSON metadata, and attached files
 */
router.get('/zip', (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    const notes = db.prepare(`
      SELECT * FROM notes 
      WHERE user_id = ? 
      ORDER BY date DESC, created_at DESC
    `).all(userId);

    const filename = `daily-notes-backup-${formatDate(new Date())}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    archive.on('error', (err) => {
      console.error('Archiver error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to create zip backup.' });
      }
    });

    archive.pipe(res);

    // 1. Add README
    const readmeContent = `Daily Notes Backup
User: ${userEmail}
Exported at: ${new Date().toISOString()}
Total notes: ${notes.length}

Contents:
- notes.json: Full machine-readable export with metadata
- markdown/: Each note saved as a Markdown (.md) document
- attachments/: Files uploaded and attached to your notes
`;
    archive.append(readmeContent, { name: 'README.txt' });

    // 2. Add JSON data
    const exportNotesData = [];

    // 3. Add Markdown notes and collect attachment paths
    notes.forEach((note, idx) => {
      const attachments = db.prepare('SELECT * FROM attachments WHERE note_id = ?').all(note.id);
      
      exportNotesData.push({
        ...note,
        attachments: attachments.map(a => ({
          filename: a.filename,
          mimetype: a.mimetype,
          size: a.size,
          created_at: a.created_at
        }))
      });

      // Markdown file content
      const mdContent = `---
title: "${(note.title || 'Untitled Note').replace(/"/g, '\\"')}"
date: ${note.date}
tags: [${note.tags ? note.tags.split(',').map(t => `"${t.trim()}"`).join(', ') : ''}]
created_at: ${note.created_at}
updated_at: ${note.updated_at}
attachments:
${attachments.map(a => `  - ${a.filename} (${formatBytes(a.size)})`).join('\n')}
---

# ${note.title || 'Untitled Note'}

**Date:** ${note.date}  
**Tags:** ${note.tags || 'None'}  

${note.body}

${attachments.length > 0 ? `\n### Attached Files:\n` + attachments.map(a => `- [${a.filename}](attachments/${a.stored_name})`).join('\n') : ''}
`;

      const safeTitle = sanitizeFileName(note.title || `note-${note.id}`);
      const mdFileName = `markdown/${note.date}_${safeTitle || 'note'}_${note.id}.md`;
      archive.append(mdContent, { name: mdFileName });

      // Add attached files to zip
      for (const att of attachments) {
        const filePath = path.join(uploadsDir, att.stored_name);
        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: `attachments/${att.stored_name}` });
        }
      }
    });

    archive.append(JSON.stringify(exportNotesData, null, 2), { name: 'notes.json' });

    archive.finalize();
  } catch (err) {
    console.error('ZIP export error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to create zip export.' });
    }
  }
});

module.exports = router;
