const request = require('supertest');
const app = require('../server'); // Importation de l'application Express
const mongoose = require('mongoose');

describe('Tests d\'intégration : Routes Auth', () => {

  // Couper la connexion à la base de données à la fin pour que Jest puisse s'arrêter proprement
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('Devrait rejeter une inscription avec un mot de passe non sécurisé', async () => {
    // Simulation d'une requête HTTP POST vers le serveur
    const reponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test-integration@mempa.fr',
        password: 'motdepassetropsimple'
      });

    // On s'attend à ce que le serveur refuse la requête (Erreur 400 Bad Request)
    expect(reponse.statusCode).toBe(400);
  });

  it('Devrait refuser la connexion avec un mauvais mot de passe', async () => {
    const reponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'ton_email_de_test@mempa.fr',
        password: 'FauxMotDePasse123!'
      });

    // Le serveur doit refuser l'accès (erreur 400 ou 401)
    expect(reponse.statusCode).not.toBe(200); 
  });

  it('Devrait réussir la connexion et générer un token JWT', async () => {
    const reponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'louane.deltor@toulouse.miage.fr',
        password: 'MEMPa12!'
      });

    // Le serveur doit accepter et renvoyer le jeton
    expect(reponse.statusCode).toBe(200);
    expect(reponse.body).toHaveProperty('token');
  });

});