// controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Playlist = require('../models/Playlist');

exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return res.status(400).json({ message: 'Email invalide' });

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&)'
            });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { username }] }).exec();
        if (existingUser) {
            const message = existingUser.email === email ? 'Cet email est déjà utilisé' : 'Ce nom d\'utilisateur est déjà pris';
            return res.status(400).json({ message });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword });
        await user.save();

        res.status(201).json({ message: 'Compte créé avec succès' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).exec();
        if (!user) return res.status(400).json({ message: 'Email ou mot de passe incorrect' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ message: 'Email ou mot de passe incorrect' });

        const token = jwt.sign(
            { userId: user._id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, user: { id: user._id, username: user.username, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { username } = req.body;

        if (!username || username.trim() === '') {
            return res.status(400).json({ message: 'Le pseudo ne peut pas être vide' });
        }

        const existing = await User.findOne({ username, _id: { $ne: req.user.userId } }).exec();
        if (existing) return res.status(400).json({ message: 'Ce pseudo est déjà pris' });

        const updatedUser = await User.findByIdAndUpdate(
            req.user.userId,
            { username: username.trim() },
            { returnDocument: 'after' }
        ).exec();

        await Playlist.updateMany({ createdBy: req.user.userId }, { creator: username.trim() }).exec();

        res.json({ user: { id: updatedUser._id, username: updatedUser.username, email: updatedUser.email } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};