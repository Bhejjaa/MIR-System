const Song = require('../models/Song');
const { PythonShell } = require('python-shell');
const path = require('path');
const fs = require('fs');

exports.searchByAudio = async (req, res) => {
    try {
        const audioType = req.body.audioType;
        let audioPath;

        if (audioType === 'file') {
            if (!req.file) {
                return res.status(400).json({ message: 'No audio file uploaded' });
            }
            audioPath = req.file.path;
        } else if (audioType === 'stream') {
            // Handle base64 audio data from microphone
            const audioData = req.body.audioData;
            const fileName = `${Date.now()}-mic-recording.wav`;
            audioPath = path.join(__dirname, '../../uploads', fileName);
            
            // Convert base64 to audio file
            const buffer = Buffer.from(audioData.split(',')[1], 'base64');
            fs.writeFileSync(audioPath, buffer);
        }

        const options = {
            mode: 'json',
            pythonPath: process.env.PYTHON_PATH,
            scriptPath: path.join(__dirname, '../../python_scripts'),
            args: [audioPath, audioType]
        };

        PythonShell.run('audio_processor.py', options, async (err, results) => {
            if (err) throw err;
            
            const audioFeatures = results[0];
            
            // First try exact fingerprint match
            let matches = await Song.find({
                'audioFeatures.chromaprintFingerprint': audioFeatures.chromaprintFingerprint 
            }).select('title artist album year audioFeatures metadata');

            // If no exact match, try feature-based matching
            if (matches.length === 0) {
                matches = await Song.aggregate([
                    {
                        $geoNear: {
                            near: {
                                type: "Point",
                                coordinates: audioFeatures.mfcc.flat()
                            },
                            distanceField: "mfccDistance",
                            key: "audioFeatures.mfcc",
                            spherical: true
                        }
                    },
                    {
                        $geoNear: {
                            near: {
                                type: "Point",
                                coordinates: audioFeatures.audioEmbedding.flat()
                            },
                            distanceField: "embeddingDistance",
                            key: "audioFeatures.audioEmbedding",
                            spherical: true
                        }
                    },
                    {
                        $addFields: {
                            totalScore: {
                                $add: [
                                    { $multiply: [{ $subtract: [1, { $divide: ["$mfccDistance", 1000] }] }, 0.4] },
                                    { $multiply: [{ $subtract: [1, { $divide: ["$embeddingDistance", 1000] }] }, 0.6] }
                                ]
                            }
                        }
                    },
                    {
                        $match: {
                            totalScore: { $gt: 0.5 } // Minimum confidence threshold
                        }
                    },
                    {
                        $sort: { totalScore: -1 }
                    },
                    {
                        $limit: 5
                    },
                    {
                        $project: {
                            title: 1,
                            artist: 1,
                            album: 1,
                            year: 1,
                            audioFeatures: 1,
                            metadata: 1,
                            confidence: "$totalScore"
                        }
                    }
                ]);
            }

            res.json({
                matches,
                confidence: matches.length > 0 ? calculateConfidence(matches[0], audioFeatures) : 0
            });

            // Cleanup microphone recording
            if (audioType === 'stream') {
                fs.unlink(audioPath, err => {
                    if (err) console.error('Error deleting temporary audio file:', err);
                });
            }
        });
    } catch (error) {
        // Cleanup any uploaded files in case of error
        if (req.file) {
            fs.unlink(req.file.path, err => {
                if (err) console.error('Error deleting uploaded file:', err);
            });
        }
        
        const errorMessage = error.message || 'Error processing audio';
        console.error('Audio search error:', error);
        res.status(500).json({ 
            message: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

exports.searchByLyrics = async (req, res) => {
    try {
        const { lyrics } = req.body;
        if (!lyrics) {
            return res.status(400).json({ message: 'No lyrics provided' });
        }

        const options = {
            mode: 'json',
            pythonPath: process.env.PYTHON_PATH,
            scriptPath: path.join(__dirname, '../../python_scripts'),
            args: [lyrics]
        };

        PythonShell.run('lyrics_processor.py', options, async (err, results) => {
            if (err) throw err;
            
            const lyricsFeatures = results[0];
            
            // Multi-stage lyrics matching
            const matches = await Song.find({
                $or: [
                    // Exact phrase match
                    { 'lyricsFeatures.bertEmbedding': { $near: lyricsFeatures.bertEmbedding } },
                    // Theme-based match
                    { 'lyricsFeatures.themes': { $in: lyricsFeatures.themes } },
                    // Emotion-based match
                    { 'lyricsFeatures.emotions': { $elemMatch: { 
                        emotion: { $in: lyricsFeatures.emotions },
                        score: { $gt: 0.7 }
                    }}}
                ]
            }).limit(5);

            res.json({
                matches,
                confidence: matches.length > 0 ? calculateLyricsConfidence(matches[0], lyricsFeatures) : 0
            });
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

function calculateConfidence(match, features) {
    // Calculate confidence score based on feature similarity
    const fingerprintMatch = match.audioFeatures.chromaprintFingerprint === features.chromaprintFingerprint;
    const mfccSimilarity = calculateFeatureSimilarity(match.audioFeatures.mfcc, features.mfcc);
    const spectralSimilarity = calculateFeatureSimilarity(
        match.audioFeatures.spectralContrast, 
        features.spectralContrast
    );

    return {
        overall: (fingerprintMatch ? 1 : 0.6) * (mfccSimilarity + spectralSimilarity) / 2,
        fingerprint: fingerprintMatch ? 1 : 0,
        features: (mfccSimilarity + spectralSimilarity) / 2
    };
}

function calculateLyricsConfidence(match, features) {
    // Calculate confidence score for lyrics matching
    const embeddingSimilarity = calculateCosineSimilarity(
        match.lyricsFeatures.bertEmbedding, 
        features.bertEmbedding
    );
    const themeMatch = calculateThemeOverlap(
        match.lyricsFeatures.themes, 
        features.themes
    );

    return {
        overall: (embeddingSimilarity + themeMatch) / 2,
        embedding: embeddingSimilarity,
        themes: themeMatch
    };
}

function calculateFeatureSimilarity(feature1, feature2) {
    try {
        const f1 = Array.isArray(feature1) ? feature1.flat() : feature1;
        const f2 = Array.isArray(feature2) ? feature2.flat() : feature2;
        
        // Cosine similarity calculation
        const dotProduct = f1.reduce((acc, val, i) => acc + val * f2[i], 0);
        const magnitude1 = Math.sqrt(f1.reduce((acc, val) => acc + val * val, 0));
        const magnitude2 = Math.sqrt(f2.reduce((acc, val) => acc + val * val, 0));
        
        return dotProduct / (magnitude1 * magnitude2);
    } catch (error) {
        console.error('Error calculating feature similarity:', error);
        return 0;
    }
}

exports.getAnalysis = async (req, res) => {
    try {
        const songId = req.params.id;
        const song = await Song.findById(songId);
        if (!song) {
            return res.status(404).json({ message: 'Song not found' });
        }
        res.json({
            audioFeatures: song.audioFeatures,
            genres: song.genres,
            metadata: song.metadata
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}; 