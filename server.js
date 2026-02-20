const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Storage
const textStorage = new Map(); // code -> { text, expiresAt }
const fileMetadata = new Map(); // code -> { filename, originalName, mimeType, size, expiresAt }

// Use /tmp for uploads on Vercel (only writable directory in serverless)
const UPLOAD_DIR = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Helper: Generate Short Code
function generateCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Helper: Delete File
function deleteFile(filename) {
    const filePath = path.join(UPLOAD_DIR, filename);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted file: ${filename}`);
    }
}

// Cleanup Job (Runs every minute)
setInterval(() => {
    const now = Date.now();

    // Cleanup Text
    for (const [code, data] of textStorage.entries()) {
        if (now > data.expiresAt) {
            textStorage.delete(code);
            console.log(`Expired text: ${code}`);
        }
    }

    // Cleanup Files
    for (const [code, data] of fileMetadata.entries()) {
        if (now > data.expiresAt) {
            deleteFile(data.filename);
            fileMetadata.delete(code);
            console.log(`Expired file: ${code}`);
        }
    }
}, 60 * 1000);

const EXPIRATION_TIME = 30 * 60 * 1000; // 30 minutes

// --- Endpoints ---

// 1. Text Sharing
app.post('/api/share/text', (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const code = generateCode();
    const expiresAt = Date.now() + EXPIRATION_TIME;

    textStorage.set(code, { text, expiresAt });
    res.json({ code, expiresAt });
});

app.get('/api/share/text/:code', (req, res) => {
    const { code } = req.params;
    const data = textStorage.get(code.toUpperCase());

    if (!data) return res.status(404).json({ error: 'Text not found or expired' });
    res.json({ text: data.text });
});

// 2. File & Image Sharing
app.post('/api/share/file', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const code = generateCode();
    const expiresAt = Date.now() + EXPIRATION_TIME;

    fileMetadata.set(code, {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        expiresAt
    });

    res.json({ code, expiresAt, originalName: req.file.originalname });
});

app.get('/api/share/file/:code', (req, res) => {
    const { code } = req.params;
    const data = fileMetadata.get(code.toUpperCase());

    if (!data) return res.status(404).json({ error: 'File not found or expired' });

    const filePath = path.join(UPLOAD_DIR, data.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing on server' });

    res.download(filePath, data.originalName);
});

app.get('/api/share/file/:code/info', (req, res) => {
    const { code } = req.params;
    const data = fileMetadata.get(code.toUpperCase());

    if (!data) return res.status(404).json({ error: 'File not found or expired' });

    const filePath = path.join(UPLOAD_DIR, data.filename);
    if (!fs.existsSync(filePath)) {
        fileMetadata.delete(code.toUpperCase());
        return res.status(404).json({ error: 'File missing on server' });
    }

    res.json({
        originalName: data.originalName,
        mimeType: data.mimeType,
        size: data.size,
        expiresAt: data.expiresAt
    });
});

// Serve Frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Export for Vercel serverless; also listen locally
if (process.env.VERCEL) {
    module.exports = app;
} else {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
