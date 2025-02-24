const { validationResult, check } = require('express-validator');

exports.validateAudioUpload = [
    check('audioType')
        .isIn(['file', 'stream'])
        .withMessage('Invalid audio type'),
    check('audio').custom((value, { req }) => {
        if (req.body.audioType === 'file' && !req.file) {
            throw new Error('Audio file is required');
        }
        if (req.body.audioType === 'stream' && !req.body.audioData) {
            throw new Error('Audio stream data is required');
        }
        if (req.body.audioType === 'file') {
            const supportedTypes = ['audio/mp3', 'audio/wav', 'audio/mpeg'];
            if (!supportedTypes.includes(req.file.mimetype)) {
                throw new Error('Invalid audio format');
            }
        }
        return true;
    })
];

exports.validateLyricsSearch = [
    check('lyrics')
        .notEmpty()
        .withMessage('Lyrics are required')
        .isLength({ min: 10 })
        .withMessage('Lyrics must be at least 10 characters long')
];

exports.validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}; 