# Daily Notes 📝

A clean, minimal, distraction-free web application where you can write, upload, and organize your daily notes with ease.

Built with **React + Vite + Tailwind CSS** on the frontend, and **Node.js + Express with SQLite** on the backend.

---

## ✨ Features

- **Daily View**: Notes grouped chronologically with **today's notes shown first**.
- **Rich Note Creation**: Title, body text, date (defaults to today), and tags.
- **Drag-and-Drop File Uploads**: Upload images, PDFs, Word docs (`.docx`), and text files (`.txt`/`.md`) up to 10 MB per file, with instant inline previews and downloads.
- **Auto-Save Drafts**: Automatically saves in-progress drafts to local storage so nothing is lost if the page reloads or closes.
- **Calendar View**: Interactive monthly calendar with badges showing days that have notes. Click any date to view and add notes for that day.
- **Fast Search & Filtering**: Real-time keyword search across title, body, and tags, plus tag filter chips and date range filters.
- **Edit & Delete**: Full editing capabilities and safe delete confirmation prompt dialogs.
- **Export & Backup**:
  - **PDF Export**: Generate formatted, printable PDF documents of your notes.
  - **Full .ZIP Backup**: Complete backup archive containing structured JSON, individual Markdown (`.md`) files, and all attached files.
- **Privacy & Authentication**: Simple email + password authentication (with 1-click Demo Account option). Each user's notes remain strictly private.
- **Clean Responsive Design**: Minimal, distraction-free layout with persistent **Dark Mode** and **Light Mode** toggle.
- **Productivity Shortcuts**:
  - `Ctrl + N` / `Cmd + N`: Open New Note dialog
  - `Ctrl + S` / `Cmd + S`: Save note inside editor
  - `Ctrl + F` / `Cmd + F`: Focus search bar
  - `Esc`: Close modals

---

## 📁 Project Structure

```
daily-notes/
├── backend/
│   ├── data/                 # SQLite database storage (notes.db)
│   ├── middleware/
│   │   └── auth.js           # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js           # Register, login, profile routes
│   │   ├── notes.js          # Notes CRUD, filtering, tags, attachments
│   │   └── export.js         # PDF generation & ZIP backup archive routes
│   ├── uploads/              # Uploaded file attachments (images, PDFs, docs)
│   ├── db.js                 # SQLite database setup & starter note seeds
│   ├── upload.js             # Multer file upload configuration (10 MB limit)
│   ├── server.js             # Express application entrypoint
│   ├── .env                  # Backend configuration (PORT, JWT_SECRET)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthPage.jsx            # Sign in, Sign up, and 1-Click Demo
│   │   │   ├── CalendarView.jsx        # Monthly interactive calendar
│   │   │   ├── DailyView.jsx           # Daily view (today first)
│   │   │   ├── DeleteConfirmModal.jsx  # Confirmation dialog for note deletion
│   │   │   ├── FilePreviewModal.jsx    # Modal preview for images, PDFs, docs
│   │   │   ├── Navbar.jsx              # Navigation, + New Note button, search, theme
│   │   │   ├── NoteCard.jsx            # Clean note card with tags and file chips
│   │   │   ├── NoteEditorModal.jsx     # Note editor with drag-and-drop & auto-save
│   │   │   ├── SearchView.jsx          # Keyword, tag, and date range search
│   │   │   └── SettingsView.jsx        # Appearance, data export, shortcuts
│   │   ├── context/
│   │   │   ├── AuthContext.jsx         # User authentication state
│   │   │   ├── ThemeContext.jsx        # Light/Dark mode state
│   │   │   └── ToastContext.jsx        # Toast notification system
│   │   ├── api.js                      # API client with token management
│   │   ├── App.jsx                     # Root application coordinator
│   │   ├── main.jsx                    # React entrypoint
│   │   └── index.css                   # Tailwind CSS styles
│   ├── tailwind.config.js
│   ├── vite.config.js                  # Vite server & API proxy
│   └── package.json
│
├── package.json                        # Root workspace scripts
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+ (Node.js 22 or 24 recommended, which has built-in SQLite support)
- **npm** v9+

### 1. Install Dependencies

You can install both backend and frontend dependencies in one command from the `daily-notes` directory:

```bash
# From the daily-notes folder:
npm --prefix backend install
npm --prefix frontend install
```

### 2. Environment Variables

The backend uses a `.env` file located in `backend/.env`. A ready default is pre-created:

```env
PORT=5000
JWT_SECRET=daily-notes-secret-key-super-secure-2026
```

### 3. Run the Application

Open two terminal windows or tabs:

**Terminal 1 (Backend API):**
```bash
cd backend
npm run dev
# Server starts at http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd frontend
npm run dev
# Frontend starts at http://localhost:5173
```

Open your browser and navigate to:
👉 **`http://localhost:5173`**

---

## 💡 Quick Demo / First Run

- Click **"Explore Demo Account (1-Click)"** on the login page to immediately log in.
- The app automatically seeds **4 rich sample notes** with tags, dates, and tips so the notebook never looks empty on first launch!
- You can create your own account anytime with email and password.

---

## 🔒 Security & Data Privacy

- Passwords are encrypted with **bcrypt**.
- Authentication uses secure **JWT (JSON Web Tokens)**.
- User data is strictly isolated: SQL queries always filter by `user_id`.
- Uploaded files are strictly restricted to 10 MB per file with file type validation.
