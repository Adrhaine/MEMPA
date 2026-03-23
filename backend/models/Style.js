const mongoose = require('mongoose');

const StyleSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true },
    color1: { type: String, default: '#3d2d1e' }, // couleur de départ du gradient
    color2: { type: String, default: '#1a1410' }  // couleur de fin du gradient
}, {
    timestamps: true
});

module.exports = mongoose.model('Style', StyleSchema, 'styles');