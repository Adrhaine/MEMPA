require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 3000;

// On connecte la base de données
connectDB().then(() => {
    // Une fois connecté, on lance le serveur
    if (process.env.NODE_ENV !== 'test') {
        app.listen(PORT, () => console.log(`✅ Serveur lancé sur le port ${PORT}`));
    }
});