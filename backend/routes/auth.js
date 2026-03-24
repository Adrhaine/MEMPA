const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {updateProfile, login, register} = require("../controllers/authControllers");

router.post('/register', register);
router.post('/login', login);
router.patch('/profile', authMiddleware, updateProfile);

module.exports = router;