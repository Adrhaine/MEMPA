const Playlists = require('../models/Playlist');
const { cloudinary } = require('../middleware/upload');

// Fonction utilitaire
function getRandomDuration() {
    const minSeconds = 90;
    const maxSeconds = 180;
    const totalSeconds = Math.floor(Math.random() * (maxSeconds - minSeconds + 1)) + minSeconds;
    const minutes = Math.floor(totalSeconds / 60);
    return `${minutes}:${(totalSeconds % 60).toString().padStart(2, '0')}`;
}

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

exports.getAllPlaylists = async (req, res) => {
    try {
        const { sortBy, order, search } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 8;
        const skip = (page - 1) * limit;

        const conditions = [];
        if (search) conditions.push({ name: { $regex: search, $options: 'i' } });
        if (req.query.styles) conditions.push({ style: { $in: req.query.styles.split(',') } });

        const filter = conditions.length > 0 ? { $and: conditions } : {};
        const sortOptions = sortBy ? { [sortBy]: order === 'desc' ? -1 : 1 } : {};

        const [playlists, total] = await Promise.all([
            Playlists.find(filter).sort(sortOptions).skip(skip).limit(limit).exec(), // .exec() ajouté !
            Playlists.countDocuments(filter).exec()
        ]);

        res.json({ playlists, total, page, totalPages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getStyles = async (req, res) => {
    try {
        const styles = await Playlists.distinct('style').exec();
        res.json(styles.sort());
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getMyPlaylists = async (req, res) => {
    try {
        const playlists = await Playlists.find({ createdBy: req.user.userId }).sort({ createdAt: -1 }).exec();
        res.json(playlists);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getLikedPlaylists = async (req, res) => {
    try {
        const playlists = await Playlists.find({ likes: req.user.userId }).sort({ createdAt: -1 }).exec();
        res.json(playlists);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getPlaylistById = async (req, res) => {
    try {
        const playlist = await Playlists.findByIdAndUpdate(req.params.id, { $inc: { clicks: 1 } }, { returnDocument: 'after' }).exec();
        if (!playlist) return res.status(404).json({ message: 'Playlist non trouvée' });
        res.json(playlist);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createPlaylist = async (req, res) => {
    try {
        const { name, creator, style, songs } = req.body;

        // CORRECTION SÉCURITÉ : try/catch sur JSON.parse
        let parsedSongs = [];
        if (songs) {
            try {
                parsedSongs = JSON.parse(songs);
            } catch (e) {
                return res.status(400).json({ message: 'Format des chansons invalide.' });
            }
        }

        if (!parsedSongs || parsedSongs.length === 0) {
            return res.status(400).json({ message: 'Une playlist doit obligatoirement contenir au moins une musique.' });
        }

        const songsWithDuration = parsedSongs.map(song => ({ ...song, duration: getRandomDuration() }));

        const playlist = new Playlists({
            name, creator, style,
            songs: songsWithDuration,
            contributors: [],
            coverImage: req.file ? req.file.path : null,
            createdBy: req.user.userId
        });

        const saved = await playlist.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateCover = async (req, res) => {
    try {
        const playlist = await Playlists.findById(req.params.id).exec();
        if (!playlist) return res.status(404).json({ message: 'Playlist non trouvée' });

        if (playlist.createdBy.toString() !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Action non autorisée' });
        }

        await deleteCloudinaryImage(playlist.coverImage);

        const updated = await Playlists.findByIdAndUpdate(
            req.params.id,
            { coverImage: req.file ? req.file.path : null },
            { returnDocument: 'after' }
        ).exec();

        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.renamePlaylist = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || name.trim() === '') return res.status(400).json({ message: 'Nom vide' });

        const playlist = await Playlists.findById(req.params.id).exec();
        if (!playlist) return res.status(404).json({ message: 'Playlist non trouvée' });

        if (playlist.createdBy.toString() !== req.user.userId) return res.status(403).json({ message: 'Action réservée au créateur' });

        const updated = await Playlists.findByIdAndUpdate(req.params.id, { name: name.trim() }, { returnDocument: 'after' }).exec();
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.addSongs = async (req, res) => {
    try {
        const { songs } = req.body;
        if (!songs || !Array.isArray(songs) || songs.length === 0) return res.status(400).json({ message: 'Aucun morceau fourni' });

        const playlist = await Playlists.findById(req.params.id).exec();
        if (!playlist) return res.status(404).json({ message: 'Playlist non trouvée' });

        const update = { $push: { songs: { $each: songs.map(s => ({ ...s, duration: getRandomDuration() })) } } };
        if (playlist.creator !== req.user.username) update.$addToSet = { contributors: req.user.username };

        const updatedPlaylist = await Playlists.findByIdAndUpdate(req.params.id, update, { returnDocument: 'after' }).exec();
        res.json(updatedPlaylist);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.toggleLike = async (req, res) => {
    try {
        const playlist = await Playlists.findById(req.params.id).exec();
        if (!playlist) return res.status(404).json({ message: 'Playlist non trouvée' });

        const alreadyLiked = playlist.likes.some(id => id.toString() === req.user.userId);
        const update = alreadyLiked ? { $pull: { likes: req.user.userId } } : { $addToSet: { likes: req.user.userId } };

        const updated = await Playlists.findByIdAndUpdate(req.params.id, update, { returnDocument: 'after' }).exec();
        res.json({ likes: updated.likes.length, liked: !alreadyLiked });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deletePlaylist = async (req, res) => {
    try {
        const playlist = await Playlists.findById(req.params.id).exec();
        if (!playlist) return res.status(404).json({ message: 'Playlist non trouvée' });

        if (playlist.createdBy.toString() !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        await deleteCloudinaryImage(playlist.coverImage);
        await Playlists.findByIdAndDelete(req.params.id).exec();
        res.json({ message: 'Playlist supprimée' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteSong = async (req, res) => {
    try {
        const playlist = await Playlists.findById(req.params.id).exec();
        if (!playlist) return res.status(404).json({ message: 'Playlist non trouvée' });

        if (playlist.createdBy.toString() !== req.user.userId && req.user.role !== 'admin') return res.status(403).json({ message: 'Non autorisé' });

        const index = parseInt(req.params.songIndex);
        if (isNaN(index) || index < 0 || index >= playlist.songs.length) return res.status(400).json({ message: 'Index invalide' });

        playlist.songs.splice(index, 1);
        const updatedPlaylist = await playlist.save();
        res.json(updatedPlaylist);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};