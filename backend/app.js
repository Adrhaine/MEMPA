const express = require('express');
const cors = require('cors');

const playlistRoutes = require('./routes/playlists');
const authRoutes = require('./routes/auth');
const stylesRoutes = require('./routes/styles');
const adminRoutes = require('./routes/admin');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/playlists', playlistRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/styles', stylesRoutes);
app.use('/api/admin', adminRoutes);

module.exports = app; // On exporte juste l'app configurée