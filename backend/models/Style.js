const mongoose = require('mongoose');

const StyleSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('Style', StyleSchema, 'styles');