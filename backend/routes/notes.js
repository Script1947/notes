const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { db, formatDate } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { upload, uploadsDir } = require('../upload');

// All note routes require authentication
router.use(authenticateToken);

/**
 * Helper to parse note rows and load their attachments
 */
function enrichNotesWithAttachments(notesList) {
  if (!notesList || notesList.length === 0) return [];

  const noteIds = notesList.map(n => n.id);
  // Prepare placeholders
  const placeholders = noteIds.map(() => '?').join(',');
  const attachments = db.prepare(`
    SELECT * FROM attachments 
    WHERE note_id IN (${placeholders})
    ORDER BY id ASC
  `).all(...noteIds);

  const attachmentsByNoteId = {};
  for (const att of attachments) {
    if (!attachmentsByNoteId[att.note_id]) {
      attachmentsByNoteId[att.note_id] = [];
    }
    attachmentsByNoteId[att.note_id].push({
      id: att.id,
      filename: att.filename,
      storedName: att.stored_name,
      mimetype: att.mimetype,
      size: att.size,
      url: `/api/uploads/${encodeURIComponent(att.stored_name)}`,
      createdAt: att.created_at
    });
  }

  return notesList.map(note => {
    // Parse tags into array
    const tagArray = note.tags 
      ? note.tags.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    return {
      ...note,
      is_pinned: Boolean(note.is_pinned),
      tags: tagArray,
      rawTags: note.tags || '',
      attachments: attachmentsByNoteId[note.id] || []
    };
  });
}

/**
 * GET /api/notes
 * Query params: search, tag, startDate, endDate, date
 */
router.get('/', (req, res) => {
  try {
    const userId = req.user.id;
    const { search, tag, startDate, endDate, date } = req.query;

    let query = `SELECT * FROM notes WHERE user_id = ?`;
    const params = [userId];

    if (date) {
      query += ` AND date = ?`;
      params.push(date.trim());
    }

    if (startDate) {
      query += ` AND date >= ?`;
      params.push(startDate.trim());
    }

    if (endDate) {
      query += ` AND date <= ?`;
      params.push(endDate.trim());
    }

    if (tag) {
      query += ` AND (tags LIKE ? OR tags LIKE ? OR tags LIKE ? OR tags = ?)`;
      const cleanTag = tag.trim();
      params.push(`%, ${cleanTag},%`, `${cleanTag},%`, `%, ${cleanTag}`, cleanTag);
    }

    if (search) {
      const term = `%${search.trim()}%`;
      query += ` AND (title LIKE ? OR body LIKE ? OR tags LIKE ?)`;
      params.push(term, term, term);
    }

    // Order by date DESC, then is_pinned DESC, then created_at DESC
    query += ` ORDER BY date DESC, is_pinned DESC, created_at DESC`;

    const notes = db.prepare(query).all(...params);
    const enriched = enrichNotesWithAttachments(notes);

    return res.json({ notes: enriched, count: enriched.length });
  } catch (err) {
    console.error('Fetch notes error:', err);
    return res.status(500).json({ error: 'Failed to retrieve notes.' });
  }
});

/**
 * GET /api/notes/calendar-summary
 * Returns counts of notes per date for the current user
 */
router.get('/calendar-summary', (req, res) => {
  try {
    const userId = req.user.id;
    const rows = db.prepare(`
      SELECT date, COUNT(*) as count 
      FROM notes 
      WHERE user_id = ? 
      GROUP BY date
    `).all(userId);

    const summary = {};
    for (const r of rows) {
      summary[r.date] = r.count;
    }

    return res.json({ summary });
  } catch (err) {
    console.error('Calendar summary error:', err);
    return res.status(500).json({ error: 'Failed to fetch calendar summary.' });
  }
});

/**
 * GET /api/notes/tags
 * Returns all unique tags used by the user with their usage count
 */
router.get('/tags', (req, res) => {
  try {
    const userId = req.user.id;
    const notes = db.prepare('SELECT tags FROM notes WHERE user_id = ? AND tags IS NOT NULL AND tags != ""').all(userId);

    const tagCounts = {};
    for (const row of notes) {
      if (!row.tags) continue;
      const split = row.tags.split(',').map(t => t.trim()).filter(Boolean);
      for (const t of split) {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      }
    }

    const tagList = Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return res.json({ tags: tagList });
  } catch (err) {
    console.error('Fetch tags error:', err);
    return res.status(500).json({ error: 'Failed to fetch tags.' });
  }
});

/**
 * GET /api/notes/:id
 */
router.get('/:id', (req, res) => {
  try {
    const userId = req.user.id;
    const noteId = req.params.id;

    const note = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?').get(noteId, userId);
    if (!note) {
      return res.status(404).json({ error: 'Note not found.' });
    }

    const enriched = enrichNotesWithAttachments([note]);
    return res.json({ note: enriched[0] });
  } catch (err) {
    console.error('Get note error:', err);
    return res.status(500).json({ error: 'Failed to get note.' });
  }
});

/**
 * POST /api/notes
 * Creates note and optionally uploads attached files simultaneously
 */
router.post('/', upload.array('files', 10), (req, res) => {
  try {
    const userId = req.user.id;
    let { title, body, date, tags, is_pinned } = req.body;

    if (!title && !body) {
      return res.status(400).json({ error: 'A note must have at least a title or some text.' });
    }

    title = (title || 'Untitled Note').trim();
    body = (body || '').trim();
    date = (date || formatDate(new Date())).trim();

    // Clean tags if string or array
    let tagsStr = '';
    if (Array.isArray(tags)) {
      tagsStr = tags.map(t => t.trim()).filter(Boolean).join(', ');
    } else if (typeof tags === 'string') {
      tagsStr = tags.split(',').map(t => t.trim()).filter(Boolean).join(', ');
    }

    const now = new Date().toISOString();
    const isPinnedVal = (is_pinned === true || is_pinned === 'true' || is_pinned === 1 || is_pinned === '1') ? 1 : 0;

    const result = db.prepare(`
      INSERT INTO notes (user_id, title, body, date, tags, is_pinned, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, title, body, date, tagsStr, isPinnedVal, now, now);

    const noteId = Number(result.lastInsertRowid);

    // Save any uploaded files
    if (req.files && req.files.length > 0) {
      const insertAttStmt = db.prepare(`
        INSERT INTO attachments (note_id, filename, stored_name, filepath, mimetype, size, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const file of req.files) {
        insertAttStmt.run(
          noteId,
          file.originalname,
          file.filename,
          file.path,
          file.mimetype,
          file.size,
          now
        );
      }
    }

    const createdNote = db.prepare('SELECT * FROM notes WHERE id = ?').get(noteId);
    const enriched = enrichNotesWithAttachments([createdNote]);

    return res.status(201).json({
      message: 'Note created successfully!',
      note: enriched[0]
    });
  } catch (err) {
    console.error('Create note error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create note.' });
  }
});

/**
 * PUT /api/notes/:id
 * Updates note and optionally adds new files
 */
router.put('/:id', upload.array('files', 10), (req, res) => {
  try {
    const userId = req.user.id;
    const noteId = req.params.id;

    const existing = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?').get(noteId, userId);
    if (!existing) {
      return res.status(404).json({ error: 'Note not found.' });
    }

    let { title, body, date, tags, is_pinned } = req.body;

    const updatedTitle = title !== undefined ? title.trim() : existing.title;
    const updatedBody = body !== undefined ? body.trim() : existing.body;
    const updatedDate = date !== undefined ? date.trim() : existing.date;

    let updatedTags = existing.tags;
    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        updatedTags = tags.map(t => t.trim()).filter(Boolean).join(', ');
      } else if (typeof tags === 'string') {
        updatedTags = tags.split(',').map(t => t.trim()).filter(Boolean).join(', ');
      }
    }

    let updatedPinned = existing.is_pinned;
    if (is_pinned !== undefined) {
      updatedPinned = (is_pinned === true || is_pinned === 'true' || is_pinned === 1 || is_pinned === '1') ? 1 : 0;
    }

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE notes 
      SET title = ?, body = ?, date = ?, tags = ?, is_pinned = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(updatedTitle, updatedBody, updatedDate, updatedTags, updatedPinned, now, noteId, userId);

    // If new files were uploaded with the update
    if (req.files && req.files.length > 0) {
      const insertAttStmt = db.prepare(`
        INSERT INTO attachments (note_id, filename, stored_name, filepath, mimetype, size, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const file of req.files) {
        insertAttStmt.run(
          noteId,
          file.originalname,
          file.filename,
          file.path,
          file.mimetype,
          file.size,
          now
        );
      }
    }

    const updatedNote = db.prepare('SELECT * FROM notes WHERE id = ?').get(noteId);
    const enriched = enrichNotesWithAttachments([updatedNote]);

    return res.json({
      message: 'Note updated successfully!',
      note: enriched[0]
    });
  } catch (err) {
    console.error('Update note error:', err);
    return res.status(500).json({ error: err.message || 'Failed to update note.' });
  }
});

/**
 * DELETE /api/notes/:id
 * Deletes note and its attached files from disk
 */
router.delete('/:id', (req, res) => {
  try {
    const userId = req.user.id;
    const noteId = req.params.id;

    const existing = db.prepare('SELECT id FROM notes WHERE id = ? AND user_id = ?').get(noteId, userId);
    if (!existing) {
      return res.status(404).json({ error: 'Note not found.' });
    }

    // Find all attachments to remove files from disk
    const attachments = db.prepare('SELECT stored_name FROM attachments WHERE note_id = ?').all(noteId);
    for (const att of attachments) {
      const filePath = path.join(uploadsDir, att.stored_name);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.warn('Could not delete file:', filePath, e.message);
        }
      }
    }

    // Delete note (cascade will delete attachments rows in SQLite)
    db.prepare('DELETE FROM attachments WHERE note_id = ?').run(noteId);
    db.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?').run(noteId, userId);

    return res.json({ message: 'Note deleted successfully!' });
  } catch (err) {
    console.error('Delete note error:', err);
    return res.status(500).json({ error: 'Failed to delete note.' });
  }
});

/**
 * DELETE /api/notes/:noteId/attachments/:attachmentId
 * Deletes a single attachment from a note
 */
router.delete('/:noteId/attachments/:attachmentId', (req, res) => {
  try {
    const userId = req.user.id;
    const { noteId, attachmentId } = req.params;

    // Verify note belongs to user
    const note = db.prepare('SELECT id FROM notes WHERE id = ? AND user_id = ?').get(noteId, userId);
    if (!note) {
      return res.status(404).json({ error: 'Note not found.' });
    }

    const att = db.prepare('SELECT * FROM attachments WHERE id = ? AND note_id = ?').get(attachmentId, noteId);
    if (!att) {
      return res.status(404).json({ error: 'Attachment not found.' });
    }

    const filePath = path.join(uploadsDir, att.stored_name);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.warn('Could not unlink file:', filePath, e.message);
      }
    }

    db.prepare('DELETE FROM attachments WHERE id = ?').run(attachmentId);

    return res.json({ message: 'Attachment deleted successfully!' });
  } catch (err) {
    console.error('Delete attachment error:', err);
    return res.status(500).json({ error: 'Failed to delete attachment.' });
  }
});

module.exports = router;
