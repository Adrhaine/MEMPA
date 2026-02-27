const mongoose = require('mongoose');

const SongSchema = new mongoose.Schema({
    title:  { type: String, required: true },
    artist: { type: String, required: true }
});

const PlaylistSchema = new mongoose.Schema({
    name:         { type: String, required: true },
    creator:      { type: String, required: true },
    clicks:       { type: Number, default: 0 },
    songs:        [SongSchema],
    contributors: [String],
    style:        { type: String, required: true }
});

module.exports = mongoose.model('Playlist', PlaylistSchema, 'playlists');