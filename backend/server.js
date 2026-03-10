const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.set('returnDocument', 'after');

const MONGO_URL = process.env.NODE_ENV === 'prod'
    ? process.env.MONGO_URL_PROD
    : process.env.MONGO_URL_DEV;

mongoose.connect(MONGO_URL)
    .then(() => console.log(`✅ MongoDB connecté (${process.env.NODE_ENV})`))
    .catch(err => console.error(':x: Erreur MongoDB :', err));

const playlistRoutes = require('./routes/playlists');
const authRoutes = require('./routes/auth');
app.use('/api/playlists', playlistRoutes);
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Serveur lancé sur le port ${PORT}`));