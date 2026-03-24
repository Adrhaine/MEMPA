const express  = require('express');
const router   = express.Router();
const authMiddleware = require('../middleware/auth');
const Playlists = require('../models/Playlist');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Configuration Cloudinary avec les variables d'environnement
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// On dit à multer de stocker directement sur Cloudinary
// au lieu du disque local
const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        return {
            folder: 'mempa/covers',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
            transformation: [{ width: 500, height: 500, crop: 'fill' }]
        };
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5 Mo max
});

// Fonction utilitaire durée aléatoire
function getRandomDuration() {
    const minSeconds = 90;
    const maxSeconds = 180;
    const totalSeconds = Math.floor(Math.random() * (maxSeconds - minSeconds + 1)) + minSeconds;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Fonction pour supprimer une image sur Cloudinary
// public_id est l'identifiant unique de l'image sur Cloudinary
async function deleteCloudinaryImage(coverImage) {
    if (!coverImage) return;
    try {
        // L'URL Cloudinary contient le public_id dans le chemin
        // Ex: https://res.cloudinary.com/moncloud/image/upload/v123/mempa/covers/abc123.jpg
        // On extrait "mempa/covers/abc123" (sans l'extension)
        const urlParts = coverImage.split('/');
        const filename = urlParts[urlParts.length - 1].split('.')[0];
        const publicId = `mempa/covers/${filename}`;
        await cloudinary.uploader.destroy(publicId);
    } catch (err) {
        // On log l'erreur mais on ne bloque pas la requête
        console.error('Erreur suppression Cloudinary:', err);
    }
}

// GET — toutes les playlists avec tri et/ou filtre
router.get('/', async (req, res) => {
    try {
        const { sortBy, order, search } = req.query;

        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 8;
        const skip  = (page - 1) * limit;

        let filter = {};
        const conditions = [];
        if (search) {
            conditions.push({ name: { $regex: search, $options: 'i' } });
        }
        if (req.query.styles) {
            const stylesArray = req.query.styles.split(',');
            conditions.push({ style: { $in: stylesArray } });
        }
        if (conditions.length > 0) {
            filter = { $and: conditions };
        }

        let sortOptions = {};
        if (sortBy) {
            sortOptions[sortBy] = order === 'desc' ? -1 : 1;
        }

        const [playlists, total] = await Promise.all([
            Playlists.find(filter).sort(sortOptions).skip(skip).limit(limit),
            Playlists.countDocuments(filter)
        ]);

        res.json({ playlists, total, page, totalPages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET — styles distincts
router.get('/styles', async (req, res) => {
    try {
        const styles = await Playlists.distinct('style');
        res.json(styles.sort());
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET — playlists de l'utilisateur connecté
router.get('/my', authMiddleware, async (req, res) => {
    try {
        const playlists = await Playlists.find({ createdBy: req.user.userId })
            .sort({ createdAt: -1 });
        res.json(playlists);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET — playlists likées
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
        if (!playlist) return res.status(404).json({ message: 'Playlist non trouvée' });
        res.json(playlist);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST — créer une playlist avec pochette optionnelle
router.post('/', authMiddleware, upload.single('cover'), async (req, res) => {
    try {
        const { name, creator, style, songs } = req.body;
        const parsedSongs = songs ? JSON.parse(songs) : [];

        if (!parsedSongs || parsedSongs.length === 0) {
            return res.status(400).json({
                message: 'Une playlist doit obligatoirement contenir au moins une musique.'
            });
        }

        const songsWithDuration = parsedSongs.map(song => ({
            ...song,
            duration: getRandomDuration()
        }));

        // Cloudinary retourne l'URL complète directement dans req.file.path
        const coverImage = req.file ? req.file.path : null;

        const playlist = new Playlists({
            name,
            creator,
            style,
            songs: songsWithDuration,
            contributors: [],
            coverImage,
            createdBy: req.user.userId
        });

        const saved = await playlist.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PATCH — modifier la pochette
router.patch('/:id/cover', authMiddleware, upload.single('cover'), async (req, res) => {
    try {
        const playlist = await Playlists.findById(req.params.id);
        if (!playlist) {
            return res.status(404).json({ message: 'Playlist non trouvée' });
        }

        // On vérifie que c'est bien le créateur OU un admin
        if (playlist.createdBy.toString() !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Action réservée au créateur ou à l\'administrateur' });
        }

        // Supprime l'ancienne image sur Cloudinary avant d'en mettre une nouvelle
        await deleteCloudinaryImage(playlist.coverImage);

        const coverImage = req.file ? req.file.path : null;

        const updated = await Playlists.findByIdAndUpdate(
            req.params.id,
            { coverImage },
            { returnDocument: 'after' }
        );

        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PATCH — renommer une playlist (créateur uniquement)
router.patch('/:id/rename', authMiddleware, async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({ message: 'Le nom ne peut pas être vide' });
        }

        const playlist = await Playlists.findById(req.params.id);
        if (!playlist) {
            return res.status(404).json({ message: 'Playlist non trouvée' });
        }

        if (playlist.createdBy.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Action réservée au créateur' });
        }

        const updated = await Playlists.findByIdAndUpdate(
            req.params.id,
            { name: name.trim() },
            { returnDocument: 'after' }
        );

        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PATCH — ajouter des morceaux (protégée, tout utilisateur connecté)
router.patch('/:id/songs', authMiddleware, async (req, res) => {
    try {
        const { songs } = req.body;

        if (!songs || !Array.isArray(songs) || songs.length === 0) {
            return res.status(400).json({ message: 'Aucun morceau fourni' });
        }

        const playlist = await Playlists.findById(req.params.id).exec();
        if (!playlist) {
            return res.status(404).json({ message: 'Playlist non trouvée' });
        }

        const songsWithDuration = songs.map(song => ({
            ...song,
            duration: getRandomDuration()
        }));

        const update = {
            $push: { songs: { $each: songsWithDuration } }
        };

        if (playlist.creator !== req.user.username) {
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

        const userId = req.user.userId;
        const alreadyLiked = playlist.likes.some(id => id.toString() === userId);

        const update = alreadyLiked
            ? { $pull:     { likes: userId } }
            : { $addToSet: { likes: userId } };

        const updated = await Playlists.findByIdAndUpdate(
            req.params.id,
            update,
            { returnDocument: 'after' }
        );

        res.json({
            likes: updated.likes.length,         // nb total de likes
            liked: !alreadyLiked                 // état après l'action
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE — supprimer une playlist (protégée, créateur uniquement)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const playlist = await Playlists.findById(req.params.id);
        if (!playlist) {
            return res.status(404).json({ message: 'Playlist non trouvée' });
        }

        if (playlist.createdBy.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer cette playlist' });
        }

        // Supprime aussi l'image sur Cloudinary
        await deleteCloudinaryImage(playlist.coverImage);
        await Playlists.findByIdAndDelete(req.params.id);
        res.json({ message: 'Playlist supprimée avec succès' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE — supprimer un morceau précis d'une playlist (créateur ou admin)
router.delete('/:id/songs/:songIndex', authMiddleware, async (req, res) => {
    try {
        const playlist = await Playlists.findById(req.params.id);
        if (!playlist) return res.status(404).json({ message: 'Playlist non trouvée' });

        // Vérification des droits (Créateur ou Admin)
        if (playlist.createdBy.toString() !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Action non autorisée' });
        }

        const index = parseInt(req.params.songIndex);
        if (isNaN(index) || index < 0 || index >= playlist.songs.length) {
            return res.status(400).json({ message: 'Index du morceau invalide' });
        }

        // On retire 1 élément à la position 'index'
        playlist.songs.splice(index, 1);

        // On sauvegarde le document mis à jour
        const updatedPlaylist = await playlist.save();
        res.json(updatedPlaylist);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;