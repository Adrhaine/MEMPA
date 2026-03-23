const express  = require('express');
const router   = express.Router();
const authMiddleware = require('../middleware/auth');
const Playlists = require('../models/Playlist');

// GET — toutes les playlists avec tri et/ou filtre
router.get('/', async (req, res) => {
    try {
        const { sortBy, order, search } = req.query;
        // req.query récupère les paramètres dans l'URL

        // Pagination — page commence à 1, limit = nb de résultats par page
        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 8;
        const skip  = (page - 1) * limit; // ex: page 2 → on saute les 8 premiers

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

        // On fait deux requêtes en parallèle :
        // 1. les playlists de la page courante
        // 2. le nombre total (pour calculer le nombre de pages)
        const [playlists, total] = await Promise.all([
            Playlists.find(filter).sort(sortOptions).skip(skip).limit(limit),
            Playlists.countDocuments(filter)
        ]);

        res.json({
            playlists,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET — liste des styles distincts présents
router.get('/styles', async (req, res) => {
    try {
        // distinct() retourne un tableau des valeurs uniques d'un champ
        const styles = await Playlists.distinct('style');
        res.json(styles.sort()); // on trie alphabétiquement
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET — playlists créées par l'utilisateur connecté
router.get('/my', authMiddleware, async (req, res) => {
    try {
        const playlists = await Playlists.find({ createdBy: req.user.userId })
            .sort({ createdAt: -1 });
        res.json(playlists);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET — playlists likées par l'utilisateur connecté
router.get('/liked', authMiddleware, async (req, res) => {
    try {
        const playlists = await Playlists.find({ likes: req.user.userId })
            .sort({ createdAt: -1 });
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
            { returnDocument: 'after' }

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

// DELETE — supprimer une playlist (protégée, créateur uniquement)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const playlist = await Playlists.findById(req.params.id);
        if (!playlist) {
            return res.status(404).json({ message: 'Playlist non trouvée' });
        }

        // On vérifie que l'utilisateur connecté est bien le créateur
        if (playlist.createdBy.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer cette playlist' });
        }

        await Playlists.findByIdAndDelete(req.params.id);
        res.json({ message: 'Playlist supprimée avec succès' });


    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// PATCH — ajouter un ou plusieurs morceaux (protégée, tout utilisateur connecté)
router.patch('/:id/songs', authMiddleware, async (req, res) => {
    try {
        const { songs } = req.body;

        if (!songs || !Array.isArray(songs) || songs.length === 0) {
            return res.status(400).json({ message: 'Aucun morceau fourni' });
        }

        // On récupère la playlist pour vérifier le créateur
        const playlist = await Playlists.findById(req.params.id).exec();
        if (!playlist) {
            return res.status(404).json({ message: 'Playlist non trouvée' });
        }

        // Construction de l'update
        const update = {
            $push: { songs: { $each: songs } }
        };

        // On ajoute aux contributeurs seulement si ce n'est pas le créateur
        if (playlist.creator !== req.user.username) {
            //On utilise le addToSet pour pas faire de doublon
            update.$addToSet = { contributors: req.user.username };
        }

        const updatedPlaylist = await Playlists.findByIdAndUpdate(
            req.params.id,
            update,
            { returnDocument: 'after' }
        );

        res.json(updatedPlaylist);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST — liker ou unliker une playlist (protégée)
router.post('/:id/like', authMiddleware, async (req, res) => {
    try {
        const playlist = await Playlists.findById(req.params.id);
        if (!playlist) {
            return res.status(404).json({ message: 'Playlist non trouvée' });
        }

        // On vérifie si l'utilisateur a déjà liké
        const userId = req.user.userId;
        const alreadyLiked = playlist.likes.some(id => id.toString() === userId);

        const update = alreadyLiked
            ? { $pull:     { likes: userId } }  // déjà liké → on retire
            : { $addToSet: { likes: userId } };  // pas encore → on ajoute

        const updated = await Playlists.findByIdAndUpdate(
            req.params.id,
            update,
            { new: true }
        );

        res.json({
            likes: updated.likes.length,         // nb total de likes
            liked: !alreadyLiked                 // état après l'action
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});



module.exports = router;