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
        const conditions = [];
        if (search) {
            conditions.push({ name: { $regex: search, $options: 'i' } });
        }
        // Filtre par styles cochés (styles est une liste séparée par des virgules)
        // ex: ?styles=Rock,Jazz
        if (req.query.styles) {
            const stylesArray = req.query.styles.split(',');
            // $in = "le style est dans ce tableau"
            conditions.push({ style: { $in: stylesArray } });
        }

        // Si on a des conditions, on les combine avec $and
        if (conditions.length > 0) {
            filter = { $and: conditions };
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

// GET — liste des styles distincts présents en BDD
// ex: ["Rock", "Jazz", "Hip-Hop"]
router.get('/styles', async (req, res) => {
    try {
        // distinct() retourne un tableau des valeurs uniques d'un champ
        const styles = await Playlists.distinct('style');
        res.json(styles.sort()); // on trie alphabétiquement
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