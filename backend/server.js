const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const multer = require('multer');

dotenv.config();

const { db, seedSampleNotes } = require('./db');
const { uploadsDir } = require('./upload');
const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');
const exportRoutes = require('./routes/export');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static uploads serving with proper content disposition / preview headers
app.use('/api/uploads', express.static(uploadsDir, {
  setHeaders: (res, filePath) => {
    // Enable inline preview for images and PDFs
    const ext = path.extname(filePath).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf', '.txt'].includes(ext)) {
      res.setHeader('Content-Disposition', 'inline');
    }
  }
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/export', exportRoutes);

// Re-seed sample notes endpoint
app.post('/api/seed', authenticateToken, (req, res) => {
  try {
    const seeded = seedSampleNotes(req.user.id);
    return res.json({ message: 'Sample notes seeded successfully!', notes: seeded });
  } catch (err) {
    console.error('Seed error:', err);
    return res.status(500).json({ error: 'Failed to seed sample notes.' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Daily Notes API', timestamp: new Date().toISOString() });
});

// Serve frontend production build if available
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Multer and general error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File exceeds the maximum allowed size of 10 MB.' });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ error: err.message || 'An error occurred during request processing.' });
  }
  next();
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Daily Notes Backend running on http://localhost:${PORT}`);
  console.log(`📁 File uploads directory: ${uploadsDir}`);
  if (fs.existsSync(frontendDist)) {
    console.log(`🌐 Serving production frontend from ${frontendDist}`);
  }
});
