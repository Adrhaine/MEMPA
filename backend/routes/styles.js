const express = require('express');
const router = express.Router();
const Style = require('../models/Style');

// GET — tous les styles disponibles
router.get('/', async (req, res) => {
    try {
        const styles = await Style.find().sort({ name: 1 });
        res.json(styles);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;