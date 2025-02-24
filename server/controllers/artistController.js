const Artist = require('../models/Artist');
const Song = require('../models/Song');

exports.getArtistInfo = async (req, res) => {
    try {
        const artist = await Artist.findById(req.params.id)
            .populate('topSongs.songId')
            .populate('similarArtists.artistId');
        
        if (!artist) {
            return res.status(404).json({ message: 'Artist not found' });
        }
        
        res.json(artist);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSimilarArtists = async (req, res) => {
    try {
        const artist = await Artist.findById(req.params.id)
            .populate('similarArtists.artistId');
        
        if (!artist) {
            return res.status(404).json({ message: 'Artist not found' });
        }
        
        res.json(artist.similarArtists);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}; 