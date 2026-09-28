const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'notes.db');
const db = new DatabaseSync(dbPath);

// Enable foreign keys and WAL mode
db.exec('PRAGMA foreign_keys = ON;');

// Initialize tables
function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      date TEXT NOT NULL,
      tags TEXT,
      is_pinned INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      stored_name TEXT NOT NULL,
      filepath TEXT NOT NULL,
      mimetype TEXT NOT NULL,
      size INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
    CREATE INDEX IF NOT EXISTS idx_notes_date ON notes(date);
    CREATE INDEX IF NOT EXISTS idx_attachments_note_id ON attachments(note_id);
  `);
}

initDb();

/**
 * Format Date as YYYY-MM-DD
 */
function formatDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Seed initial sample notes for a user
 */
function seedSampleNotes(userId) {
  const now = new Date();
  const todayStr = formatDate(now);
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDate(yesterday);

  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoStr = formatDate(twoDaysAgo);

  const sampleNotes = [
    {
      title: "Welcome to Daily Notes! 🚀",
      body: `Daily Notes is your personal space to capture ideas, organize thoughts, and keep important files all in one place.

Here are a few quick tips to get started:
• ⌨️ **Keyboard Shortcuts**: Press \`Ctrl + N\` for a new note, \`Ctrl + S\` to save quickly, and \`Ctrl + F\` to search.
• 📁 **File Uploads**: Drag and drop images, PDFs, Word documents (.docx), or text files up to 10 MB directly into any note.
• 📅 **Calendar & Daily View**: Check the Daily view to see notes chronologically, or open the Calendar to browse notes by day.
• 💾 **Auto-Save Drafts**: Even if your browser reloads or closes, your in-progress note is automatically preserved.
• 📦 **Export Any Time**: Go to Settings to download a PDF report or a full .zip backup of all notes and attachments.

Enjoy organizing your days effortlessly!`,
      date: todayStr,
      tags: "Getting Started, Tips",
      is_pinned: 1
    },
    {
      title: "Sprint Planning & Priorities 🎯",
      body: `Key objectives for this week:
- Review user feedback on note tagging and file previews.
- Ensure 100% mobile responsiveness across all viewport sizes.
- Test PDF export formatting for long-form notes.
- Verify instant search filtering across title, tags, and date ranges.

Blockers / Questions:
None currently. All features are running smoothly!`,
      date: todayStr,
      tags: "Work, Sprint",
      is_pinned: 0
    },
    {
      title: "Design Inspiration & Clean UI Principles ✨",
      body: `Principles for minimal, distraction-free software:
1. High-contrast, legible typography with comfortable line spacing.
2. Uncluttered actions: One primary "+ New Note" button, accessible at all times.
3. Fluid dark and light modes that respect user preferences.
4. Generous whitespace to let content breathe.
5. Immediate visual feedback with helpful toast notifications.`,
      date: yesterdayStr,
      tags: "Design, Ideas",
      is_pinned: 0
    },
    {
      title: "Weekly Book Notes: Deep Work 📚",
      body: `Quotes & takeaways from Cal Newport's Deep Work:
"To produce at your peak level you need to work for extended periods with full concentration on a single task free from distraction."

Key actions:
- Schedule 90-minute morning deep work blocks.
- Keep quick notes throughout the day instead of switching contexts.
- Review daily achievements at the end of each evening.`,
      date: twoDaysAgoStr,
      tags: "Personal, Books",
      is_pinned: 0
    }
  ];

  const stmt = db.prepare(`
    INSERT INTO notes (user_id, title, body, date, tags, is_pinned, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const createdNotes = [];
  for (const note of sampleNotes) {
    const timestamp = new Date().toISOString();
    const result = stmt.run(
      userId,
      note.title,
      note.body,
      note.date,
      note.tags,
      note.is_pinned,
      timestamp,
      timestamp
    );
    createdNotes.push({ id: Number(result.lastInsertRowid), ...note });
  }

  return createdNotes;
}

module.exports = {
  db,
  seedSampleNotes,
  formatDate
};
