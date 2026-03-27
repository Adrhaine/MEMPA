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

router.post('/', authMiddleware, upload.single('cover'), playlistController.createPlaylist);
router.patch('/:id/cover', authMiddleware, upload.single('cover'), playlistController.updateCover);
router.patch('/:id/rename', authMiddleware, playlistController.renamePlaylist);
router.patch('/:id/songs', authMiddleware, playlistController.addSongs);
router.post('/:id/like', authMiddleware, playlistController.toggleLike);

router.delete('/:id', authMiddleware, playlistController.deletePlaylist);
router.delete('/:id/songs/:songIndex', authMiddleware, playlistController.deleteSong);

module.exports = router;