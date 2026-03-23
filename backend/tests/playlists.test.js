const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');

describe('Tests d\'intégration : Routes Playlists', () => {
  afterAll(async () => {
    await mongoose.connection.close();
  });

  // Ajout de 10000 ms (10 secondes) comme troisième argument de "it"
  it('Devrait récupérer la liste des playlists', async () => {
    const reponse = await request(app).get('/api/playlists');
    expect(reponse.statusCode).toBe(200);
    expect(Array.isArray(reponse.body)).toBe(true);
  }, 10000); 
});