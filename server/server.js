require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const errorHandler = require('./middleware/errorHandler');
const { cleanupUploads } = require('./utils/fileUtils');

const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Create MongoDB indexes
const createIndexes = async () => {
    try {
        const Song = require('./models/Song');
        
        // Create indexes for audio feature matching
        await Song.collection.createIndex({ 'audioFeatures.mfcc': '2dsphere' });
        await Song.collection.createIndex({ 'audioFeatures.spectralContrast': '2dsphere' });
        await Song.collection.createIndex({ 'audioFeatures.audioEmbedding': '2dsphere' });
        
        // Create text index for lyrics matching
        await Song.collection.createIndex({ 'lyricsFeatures.bertEmbedding': '2dsphere' });
        await Song.collection.createIndex({ 'lyricsFeatures.themes': 1 });
        await Song.collection.createIndex({ 'lyricsFeatures.emotions.label': 1 });
        
        console.log('MongoDB indexes created successfully');
    } catch (error) {
        console.error('Error creating MongoDB indexes:', error);
    }
};

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected successfully');
        await createIndexes();
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Connect to MongoDB
connectDB();

// Routes
app.use('/api', require('./routes/songs'));

// Error handling
app.use(errorHandler);

// Schedule cleanup
setInterval(cleanupUploads, 3600000); // Run every hour

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    // Close server & exit process
    process.exit(1);
});
