const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const playlistController = require('../controllers/playlistController');

router.get('/', playlistController.getAllPlaylists);
router.get('/styles', playlistController.getStyles);
router.get('/my', authMiddleware, playlistController.getMyPlaylists);
router.get('/liked', authMiddleware, playlistController.getLikedPlaylists);
router.get('/:id', playlistController.getPlaylistById);

router.post('/', authMiddleware, (req, res, next) => {
    upload.single('cover')(req, res, (err) => {
        if (err) {
            // Ici on va enfin voir la VRAIE erreur dans la console !
            console.error('🚨 Détail de l\'erreur d\'upload :', err);
            return res.status(400).json({
                message: 'Erreur lors de l\'upload de l\'image : ' + (err.message || 'Fichier non valide')
            });
        }
        next();
    });
}, playlistController.createPlaylist);router.patch('/:id/cover', authMiddleware, upload.single('cover'), playlistController.updateCover);
router.patch('/:id/rename', authMiddleware, playlistController.renamePlaylist);
router.patch('/:id/songs', authMiddleware, playlistController.addSongs);
router.post('/:id/like', authMiddleware, playlistController.toggleLike);

router.delete('/:id', authMiddleware, playlistController.deletePlaylist);
router.delete('/:id/songs/:songIndex', authMiddleware, playlistController.deleteSong);

module.exports = router;