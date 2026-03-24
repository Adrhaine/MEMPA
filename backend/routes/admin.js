const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const adminController = require('../controllers/adminController');

// Toutes les routes de ce fichier sont protégées par les deux middlewares :
router.use(authMiddleware, adminMiddleware);

// Routes Utilisateurs
router.get('/users', adminController.getAllUsers);
router.delete('/users/:id', adminController.deleteUser);
router.patch('/users/:id/role', adminController.updateUserRole);

// Routes Playlists
router.get('/playlists', adminController.getAllPlaylists);
router.delete('/playlists/:id', adminController.deletePlaylist);

// Routes Styles
router.post('/styles', adminController.createStyle);
router.patch('/styles/:id', adminController.updateStyle);
router.delete('/styles/:id', adminController.deleteStyle);

// Route Statistiques (Dashboard Admin)
router.get('/stats', adminController.getStats);

module.exports = router;