import * as request from 'supertest';
import app from './app';

describe('GET /cats/get', () => {
    it('should return an array of cats', async () => {
      const response = await request(app).get('/cats/get');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('age');
      expect(response.body[0]).toHaveProperty('breed');
      expect(response.body[0]).toHaveProperty('picture');
    });
  });