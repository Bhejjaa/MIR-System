const express = require('express');
const router = express.Router();
const artistController = require('../controllers/artistController');

router.get('/:id', artistController.getArtistInfo);
router.get('/:id/similar', artistController.getSimilarArtists);

module.exports = router; 