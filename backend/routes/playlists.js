const express  = require('express');
const router   = express.Router();
const authMiddleware = require('../middleware/auth');
const Playlists = require('../models/Playlist');

// GET — toutes les playlists avec tri et/ou filtre
router.get('/', async (req, res) => {
    try {
        const { sortBy, order, search } = req.query;
        // req.query récupère les paramètres dans l'URL
        // ex: /api/playlists?sortBy=name&order=asc&search=rock

        // Construction du filtre de recherche full-text
        let filter = {};
        if (search) {
            // $or = cherche dans name OU style
            // $regex = recherche partielle (contient le mot)
            // $options: 'i' = insensible à la casse
            filter = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { style: { $regex: search, $options: 'i' } }
                ]
            };
        }

        // Construction du tri
        let sortOptions = {};
        if (sortBy) {
            // 1 = croissant, -1 = décroissant
            sortOptions[sortBy] = order === 'desc' ? -1 : 1;
        }

        const playlists = await Playlists.find(filter).sort(sortOptions);
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