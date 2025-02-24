const mongoose = require('mongoose');

const artistSchema = new mongoose.Schema({
    name: String,
    genres: [String],
    topSongs: [{
        songId: { type: mongoose.Schema.Types.ObjectId, ref: 'Song' },
        popularity: Number
    }],
    similarArtists: [{
        artistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Artist' },
        similarity: Number
    }],
    metadata: {
        totalSongs: Number,
        averageGenres: [String],
        popularity: Number
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Artist', artistSchema); 