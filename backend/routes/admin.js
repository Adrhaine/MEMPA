const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const User = require('../models/User');
const Playlist = require('../models/Playlist');
const Style = require('../models/Style');

// Toutes les routes de ce fichier sont protégées par les deux middlewares :
router.use(authMiddleware, adminMiddleware);



// GET /api/admin/users — liste tous les utilisateurs
router.get('/users', async (req, res) => {
    try {
        // On ne renvoie JAMAIS les mots de passe hashés, même à un admin
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 }); // les plus récents en premier
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE /api/admin/users/:id — supprime un utilisateur
router.delete('/users/:id', async (req, res) => {
    try {
        if (req.params.id === req.user.userId) {
            return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte' });
        }

        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // 1. Supprimer toutes les playlists créées par cet utilisateur
        await Playlist.deleteMany({ createdBy: req.params.id });

        // 2. Retirer les likes de cet utilisateur sur toutes les playlists
        await Playlist.updateMany(
            { likes: req.params.id },
            { $pull: { likes: req.params.id } }
        );

        res.json({ message: `Utilisateur "${user.username}" et toutes ses données ont été supprimés avec succès` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PATCH /api/admin/users/:id/role — promouvoir ou rétrograder un utilisateur
router.patch('/users/:id/role', async (req, res) => {
    try {
        const { role } = req.body;

        // Validation : seules ces deux valeurs sont acceptées
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Rôle invalide (user ou admin uniquement)' });
        }

        // un admin ne peut pas se rétrograder lui-même
        if (req.params.id === req.user.userId && role !== 'admin') {
            return res.status(400).json({ message: 'Vous ne pouvez pas rétrograder votre propre compte' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { returnDocument: 'after' } // retourne l'utilisateur mis à jour
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        res.json({ message: `Rôle mis à jour : ${user.username} est maintenant "${role}"`, user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE /api/admin/playlists/:id — supprime n'importe quelle playlist (sans vérifier le créateur)
router.delete('/playlists/:id', async (req, res) => {
    try {
        const playlist = await Playlist.findByIdAndDelete(req.params.id);
        if (!playlist) {
            return res.status(404).json({ message: 'Playlist non trouvée' });
        }
        res.json({ message: `Playlist "${playlist.name}" supprimée par l'administrateur` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/admin/playlists — toutes les playlists (avec pagination)
router.get('/playlists', async (req, res) => {
    try {
        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip  = (page - 1) * limit;

        const search = req.query.search || '';
        const filter = search
            ? { $or: [
                    { name:    { $regex: search, $options: 'i' } },
                    { creator: { $regex: search, $options: 'i' } }
                ]}
            : {};

        const [playlists, total] = await Promise.all([
            Playlist.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Playlist.countDocuments(filter)
        ]);

        res.json({ playlists, total, page, totalPages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/admin/styles — ajouter un nouveau style musical
router.post('/styles', async (req, res) => {
    try {
        const { name, color1, color2 } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({ message: 'Le nom du style est obligatoire' });
        }

        // Vérifie que le style n'existe pas déjà
        const existing = await Style.findOne({ name: { $regex: `^${name.trim()}$`, $options: 'i' } });
        if (existing) {
            return res.status(400).json({ message: `Le style "${name.trim()}" existe déjà` });
        }

        const style = new Style({
            name: name.trim(),
            color1: color1 || '#3d2d1e',
            color2: color2 || '#1a1410'
        });

        const saved = await style.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE /api/admin/styles/:id — supprimer un style musical
router.delete('/styles/:id', async (req, res) => {
    try {
        const style = await Style.findByIdAndDelete(req.params.id);
        if (!style) {
            return res.status(404).json({ message: 'Style non trouvé' });
        }
        res.json({ message: `Style "${style.name}" supprimé avec succès` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/admin/stats — statistiques globales + total utilisateurs
router.get('/stats', async (req, res) => {
    try {
        // Total utilisateurs (métrique admin spécifique, pas dans les stats publiques)
        const totalUsers = await User.countDocuments();

        const totalPlaylists = await Playlist.countDocuments();

        const songsResult = await Playlist.aggregate([
            { $group: { _id: null, total: { $sum: { $size: { $ifNull: ['$songs', []] } } } } }
        ]);
        const totalSongs = songsResult[0]?.total || 0;

        const viewsResult = await Playlist.aggregate([
            { $group: { _id: null, total: { $sum: '$clicks' } } }
        ]);
        const totalViews = viewsResult[0]?.total || 0;

        const avgSongs = totalPlaylists > 0
            ? Math.round((totalSongs / totalPlaylists) * 10) / 10
            : 0;

        const styleStats = await Playlist.aggregate([
            { $group: { _id: '$style', count: { $sum: 1 }, totalViews: { $sum: '$clicks' } } },
            { $sort: { count: -1 } }
        ]);

        const mostPopularStyle = styleStats[0]?._id || 'Aucun';

        const topPlaylists = await Playlist.find()
            .sort({ clicks: -1 })
            .limit(5)
            .select('name clicks style');

        const contributorStats = await Playlist.aggregate([
            { $unwind: { path: '$contributors', preserveNullAndEmptyArrays: false } },
            { $group: { _id: '$contributors', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);
        const topContributor = contributorStats[0]
            ? { name: contributorStats[0]._id, count: contributorStats[0].count }
            : null;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const creationsOverTime = await Playlist.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        // Top 5 playlists les plus likées
        const topLikedPlaylists = await Playlist.aggregate([
            { $project: { name: 1, style: 1, likesCount: { $size: { $ifNull: ['$likes', []] } } } },
            { $sort: { likesCount: -1 } },
            { $limit: 5 }
        ]);

        const topArtists = await Playlist.aggregate([
            { $unwind: { path: '$songs', preserveNullAndEmptyArrays: false } },
            { $group: { _id: '$songs.artist', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        res.json({
            keyMetrics: {
                totalUsers,
                totalPlaylists,
                totalSongs,
                totalViews,
                avgSongs,
                mostPopularStyle,
                topContributor,
            },
            styleStats,
            topPlaylists,
            topLikedPlaylists,
            creationsOverTime,
            topArtists
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;