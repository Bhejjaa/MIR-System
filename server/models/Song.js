const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
    // Basic Information
    title: String,
    artist: String,
    album: String,
    year: Number,
    
    // Audio Features
    audioFeatures: {
        mfcc: [[Number]],
        spectralContrast: [[Number]],
        audioEmbedding: [[Number]],
        chromaprintFingerprint: String,
        
        // Musical Features
        tempo: {
            bpm: Number,
            category: String
        },
        key: {
            key: String,
            mode: String
        },
        timeSignature: String,
        
        // Quality Metrics
        quality: {
            sampleRate: Number,
            bitDepth: Number,
            noiseLevel: Number,
            qualityScore: Number
        }
    },
    
    // Lyrics Features
    lyricsFeatures: {
        bertEmbedding: [[Number]],
        emotions: Map,
        themes: [String],
        language: String
    },
    
    // Genre Information
    genres: {
        primary: String,
        secondary: [String],
        confidence: Number
    },
    
    // Metadata
    metadata: {
        duration: Number,
        fileFormat: String,
        bitrate: Number,
        channels: Number
    },
    
    // Dataset Source
    source: {
        type: String,
        enum: ['FMA', 'musiXmatch', 'user_upload']
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Song', songSchema); 