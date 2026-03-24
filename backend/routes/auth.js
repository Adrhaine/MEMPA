const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Playlist = require('../models/Playlist');
const authMiddleware = require('../middleware/auth');

// POST /api/auth/register — Créer un compte
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validation email avec regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Email invalide' });
        }

        // Validation mot de passe
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&)'
            });
        }

        // Vérifier si l'email existe déjà
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            const message = existingUser.email === email
                ? 'Cet email est déjà utilisé'
                : 'Ce nom d\'utilisateur est déjà pris';
            return res.status(400).json({ message });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword });
        await user.save();

        res.status(201).json({ message: 'Compte créé avec succès' });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/auth/login — Se connecter
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Vérifier si l'utilisateur existe
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
        }

        // Comparer le mot de passe avec le hash en BDD
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
        }

        // Générer le token JWT (valable 24h)
        const token = jwt.sign(
            { userId: user._id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role : user.role
            }
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PATCH /api/auth/profile — Modifier le pseudo
router.patch('/profile', authMiddleware, async (req, res) => {
    try {
        const { username } = req.body;

        if (!username || username.trim() === '') {
            return res.status(400).json({ message: 'Le pseudo ne peut pas être vide' });
        }

        // Vérifier si le pseudo est déjà pris par quelqu'un d'autre
        const existing = await User.findOne({ username, _id: { $ne: req.user.userId } });
        if (existing) {
            return res.status(400).json({ message: 'Ce pseudo est déjà pris' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user.userId,
            { username: username.trim() },
            { returnDocument: 'after' }
        );

        await Playlist.updateMany(
            { createdBy: req.user.userId },
            { creator: username.trim() }
        );

        res.json({
            user: {
                id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email
            }
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;