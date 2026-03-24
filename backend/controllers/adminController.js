const User = require('../models/User');
const Playlist = require('../models/Playlist');
const Style = require('../models/Style');
const { cloudinary } = require('../middleware/upload');

// Fonction utilitaire locale
async function deleteCloudinaryImage(imageUrl) {
    if (!imageUrl) return;
    try {
        const urlParts = imageUrl.split('/');
        const filename = urlParts[urlParts.length - 1].split('.')[0];
        await cloudinary.uploader.destroy(`mempa/covers/${filename}`);
    } catch (err) {
        console.error('Erreur suppression Cloudinary:', err);
    }
}

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 }).exec();
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        if (req.params.id === req.user.userId) {
            return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte' });
        }

        const user = await User.findByIdAndDelete(req.params.id).exec();
        if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

        const userPlaylists = await Playlist.find({ createdBy: req.params.id }).exec();
        for (let p of userPlaylists) {
            await deleteCloudinaryImage(p.coverImage);
        }

        await Playlist.deleteMany({ createdBy: req.params.id }).exec();
        await Playlist.updateMany({ likes: req.params.id }, { $pull: { likes: req.params.id } }).exec();

        res.json({ message: `Utilisateur "${user.username}" et toutes ses données ont été supprimés avec succès` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Rôle invalide (user ou admin uniquement)' });
        }

        if (req.params.id === req.user.userId && role !== 'admin') {
            return res.status(400).json({ message: 'Vous ne pouvez pas rétrograder votre propre compte' });
        }

        const user = await User.findByIdAndUpdate(req.params.id, { role }, { returnDocument: 'after' })
            .select('-password').exec();

        if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

        res.json({ message: `Rôle mis à jour : ${user.username} est maintenant "${role}"`, user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deletePlaylist = async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id).exec();
        if (!playlist) return res.status(404).json({ message: 'Playlist non trouvée' });

        await deleteCloudinaryImage(playlist.coverImage);
        await Playlist.findByIdAndDelete(req.params.id).exec();

        res.json({ message: `Playlist "${playlist.name}" supprimée avec succès` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAllPlaylists = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        const filter = search
            ? { $or: [{ name: { $regex: search, $options: 'i' } }, { creator: { $regex: search, $options: 'i' } }] }
            : {};

        const [playlists, total] = await Promise.all([
            Playlist.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
            Playlist.countDocuments(filter).exec()
        ]);

        res.json({ playlists, total, page, totalPages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createStyle = async (req, res) => {
    try {
        const { name, color1, color2 } = req.body;
        if (!name || name.trim() === '') return res.status(400).json({ message: 'Le nom du style est obligatoire' });

        const existing = await Style.findOne({ name: { $regex: `^${name.trim()}$`, $options: 'i' } }).exec();
        if (existing) return res.status(400).json({ message: `Le style "${name.trim()}" existe déjà` });

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
};

exports.updateStyle = async (req, res) => {
    try {
        const { name, color1, color2 } = req.body;
        if (!name || name.trim() === '') return res.status(400).json({ message: 'Le nom du style est obligatoire' });

        const existing = await Style.findOne({
            name: { $regex: `^${name.trim()}$`, $options: 'i' },
            _id: { $ne: req.params.id }
        }).exec();

        if (existing) return res.status(400).json({ message: `Le style "${name.trim()}" existe déjà` });

        const updated = await Style.findByIdAndUpdate(
            req.params.id,
            { name: name.trim(), ...(color1 && { color1 }), ...(color2 && { color2 }) },
            { returnDocument: 'after' }
        ).exec();

        if (!updated) return res.status(404).json({ message: 'Style non trouvé' });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteStyle = async (req, res) => {
    try {
        const style = await Style.findByIdAndDelete(req.params.id).exec();
        if (!style) return res.status(404).json({ message: 'Style non trouvé' });
        res.json({ message: `Style "${style.name}" supprimé avec succès` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments().exec();
        const totalPlaylists = await Playlist.countDocuments().exec();

        const songsResult = await Playlist.aggregate([{ $group: { _id: null, total: { $sum: { $size: { $ifNull: ['$songs', []] } } } } }]).exec();
        const totalSongs = songsResult[0]?.total || 0;

        const viewsResult = await Playlist.aggregate([{ $group: { _id: null, total: { $sum: '$clicks' } } }]).exec();
        const totalViews = viewsResult[0]?.total || 0;

        const avgSongs = totalPlaylists > 0 ? Math.round((totalSongs / totalPlaylists) * 10) / 10 : 0;

        const styleStats = await Playlist.aggregate([
            { $group: { _id: '$style', count: { $sum: 1 }, totalViews: { $sum: '$clicks' } } },
            { $sort: { count: -1 } }
        ]).exec();

        const mostPopularStyle = styleStats[0]?._id || 'Aucun';

        const topPlaylists = await Playlist.find().sort({ clicks: -1 }).limit(5).select('name clicks style').exec();

        const contributorStats = await Playlist.aggregate([
            { $unwind: { path: '$contributors', preserveNullAndEmptyArrays: false } },
            { $group: { _id: '$contributors', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]).exec();

        const topContributor = contributorStats[0] ? { name: contributorStats[0]._id, count: contributorStats[0].count } : null;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const creationsOverTime = await Playlist.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]).exec();

        const topLikedPlaylists = await Playlist.aggregate([
            { $project: { name: 1, style: 1, likesCount: { $size: { $ifNull: ['$likes', []] } } } },
            { $sort: { likesCount: -1 } },
            { $limit: 5 }
        ]).exec();

        const topArtists = await Playlist.aggregate([
            { $unwind: { path: '$songs', preserveNullAndEmptyArrays: false } },
            { $group: { _id: '$songs.artist', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]).exec();

        res.json({
            keyMetrics: { totalUsers, totalPlaylists, totalSongs, totalViews, avgSongs, mostPopularStyle, topContributor },
            styleStats, topPlaylists, topLikedPlaylists, creationsOverTime, topArtists
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};