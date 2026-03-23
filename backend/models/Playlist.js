const mongoose = require('mongoose');

const SongSchema = new mongoose.Schema({
    title:  { type: String, required: true },
    artist: { type: String, required: true },
    duration: { type: String }

});

const PlaylistSchema = new mongoose.Schema({
    name:         { type: String, required: true },
    creator:      { type: String, required: true },
    clicks:       { type: Number, default: 0 },
    songs:        [SongSchema],
    contributors: [String],
    style:        { type: String, required: true },
    // ObjectId = l'identifiant unique MongoDB de l'utilisateur
    createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    likes:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, {
    timestamps: true // ajoute createdAt et updatedAt automatiquement
});

module.exports = mongoose.model('Playlist', PlaylistSchema, 'playlists');