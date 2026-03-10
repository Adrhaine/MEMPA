const express  = require('express');
const router   = express.Router();
const authMiddleware = require('../middleware/auth');
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
        );
        if (!playlist) return res.status(404).json({ message: 'Playlists non trouvée' });
        res.json(playlist);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST — créer une playlist (protégée, faut être connecté)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const playlist = new Playlists({
            ...req.body,
            createdBy: req.user.userId // on associe le créateur automatiquement
        });
        const saved = await playlist.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;