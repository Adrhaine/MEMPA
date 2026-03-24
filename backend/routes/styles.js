const express = require('express');
const router = express.Router();
const styleController = require('../controllers/styleController');

// GET — tous les styles disponibles
router.get('/', styleController.getAllStyles);

module.exports = router;