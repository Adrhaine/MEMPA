const jwt = require('jsonwebtoken');

// Ce middleware vérifie que l'utilisateur est bien connecté
// Il sera utilisé pour protéger les routes sensibles
const authMiddleware = (req, res, next) => {

    // Récupère le token dans le header de la requête
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // on prend juste la partie après "Bearer "

    // Si pas de token → accès refusé
    if (!token) {
        return res.status(401).json({ message: 'Accès refusé, token manquant' });
    }

    try {
        // Vérifie et décode le token avec notre clé secrète
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // On assigne explicitement les valeurs pour être sûr que "userId" et "role" existent bien
        req.user = {
            userId: decoded.userId || decoded.id,
            role: decoded.role,
            username: decoded.username
        };

        next();
    } catch (err) {
        return res.status(403).json({ message: 'Token invalide ou expiré' });
    }
};

module.exports = authMiddleware;