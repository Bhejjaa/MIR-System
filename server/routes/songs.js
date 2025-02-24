const express = require('express');
const router = express.Router();
const multer = require('multer');
const songController = require('../controllers/songController');
const { validateAudioUpload, validateLyricsSearch, validate } = require('../middleware/validateRequest');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/mpeg', 'audio/webm'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Search routes
router.post('/search/audio', upload.single('audio'), validateAudioUpload, validate, songController.searchByAudio);
router.post('/search/lyrics', validateLyricsSearch, validate, songController.searchByLyrics);

router.get('/analysis/:id', songController.getAnalysis);

module.exports = router; 