const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const MONGO_URL = process.env.NODE_ENV === 'prod'
            ? process.env.MONGO_URL_PROD
            : process.env.MONGO_URL_DEV;

        await mongoose.connect(MONGO_URL);
        console.log(`✅ MongoDB connecté (${process.env.NODE_ENV})`);
    } catch (err) {
        console.error('❌ Erreur MongoDB :', err);
        process.exit(1); // Arrête le serveur si la BD plante
    }
};

module.exports = connectDB;