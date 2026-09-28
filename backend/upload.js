const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage with safe unique filenames preserving original extension
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  }
});

// File filter: images, PDFs, .txt, .docx, .doc, .md
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf', '.txt', '.docx', '.doc', '.md'];
  const ext = path.extname(file.originalname).toLowerCase();

  const isAllowedExt = allowedExtensions.includes(ext);
  const isImage = file.mimetype.startsWith('image/');
  const isPdf = file.mimetype === 'application/pdf';
  const isDoc = file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.mimetype === 'application/msword';
  const isText = file.mimetype.startsWith('text/') || ext === '.txt' || ext === '.md';

  if (isAllowedExt || isImage || isPdf || isDoc || isText) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed (${ext || file.mimetype}). Please upload images, PDFs, .txt, or .docx files.`));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB per file
  },
  fileFilter: fileFilter
});

module.exports = {
  upload,
  uploadsDir
};
