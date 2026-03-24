const Style = require('../models/Style');

exports.getAllStyles = async (req, res) => {
    try {
        // Ajout du .exec() pour la propreté !
        const styles = await Style.find().sort({ name: 1 }).exec();
        res.json(styles);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};