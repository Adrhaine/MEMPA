const adminMiddleware = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            message: 'Accès refusé : droits administrateur requis'
        });
    }
    next();
};

module.exports = adminMiddleware;