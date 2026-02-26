const express  = require('express');
const router   = express.Router();
const Playlists = require('../models/Playlist');

// GET — toutes les playlists
router.get('/', async (req, res) => {
    try {
        const playlists = await Playlists.find();
        res.json(playlists);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET — une playlist par ID + incrément clics
router.get('/:id', async (req, res) => {
    try {
        const playlist = await Playlists.findByIdAndUpdate(
            req.params.id,
            { $inc: { clicks: 1 } },
            { new: true }
        );
        if (!playlist) return res.status(404).json({ message: 'Playlists non trouvée' });
        res.json(playlist);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST — créer une playlist
router.post('/', async (req, res) => {
    try {
        const playlist = new Playlists(req.body);
        const saved = await playlist.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;