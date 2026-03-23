const express = require('express');
const router = express.Router();
const Playlist = require('../models/Playlist');

// GET /api/stats — toutes les statistiques de l'application
router.get('/', async (req, res) => {
    try {

        // Total playlists
        const totalPlaylists = await Playlist.countDocuments();

        // Total morceaux (somme de tous les songs.length)
        const songsResult = await Playlist.aggregate([
            { $group: { _id: null, total: { $sum: { $size: '$songs' } } } }
        ]);
        const totalSongs = songsResult[0]?.total || 0;

        // Total vues (somme de tous les clicks)
        const viewsResult = await Playlist.aggregate([
            { $group: { _id: null, total: { $sum: '$clicks' } } }
        ]);
        const totalViews = viewsResult[0]?.total || 0;

        // Moyenne de morceaux par playlist
        const avgSongs = totalPlaylists > 0
            ? Math.round((totalSongs / totalPlaylists) * 10) / 10
            : 0;

        // Répartition des styles (pour camembert + comparaison créé vs consulté)
        const styleStats = await Playlist.aggregate([
            {
                $group: {
                    _id: '$style',
                    count: { $sum: 1 }, // nombre de playlists créées
                    totalViews: { $sum: '$clicks' } // total des vues
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Style le plus populaire (le plus créé)
        const mostPopularStyle = styleStats[0]?._id || 'Aucun';

        // Top 5 playlists les plus vues
        const topPlaylists = await Playlist.find()
            .sort({ clicks: -1 })
            .limit(5)
            .select('name clicks');

        // Nombre de morceaux par playlist (top 10)
        const songsByPlaylist = await Playlist.aggregate([
            {
                $project: {
                    name: 1,
                    songCount: { $size: '$songs' }
                }
            },
            { $sort: { songCount: -1 } },
            { $limit: 10 }
        ]);

        // Contributeur le plus actif
        const contributorStats = await Playlist.aggregate([
            { $unwind: { path: '$contributors', preserveNullAndEmptyArrays: false } },
            { $group: { _id: '$contributors', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);
        const topContributor = contributorStats[0]
            ? { name: contributorStats[0]._id, count: contributorStats[0].count }
            : null;

        // Créations par jour (30 derniers jours)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const creationsOverTime = await Playlist.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            keyMetrics: {
                totalPlaylists,
                totalSongs,
                totalViews,
                avgSongs,
                mostPopularStyle,
                topContributor
            },
            styleStats,
            topPlaylists,
            songsByPlaylist,
            creationsOverTime
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;