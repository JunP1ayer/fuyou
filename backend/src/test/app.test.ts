/* eslint-disable */
import request from 'supertest';
import app from '../app';

describe('App', () => {
  describe('GET /health', () => {
    it('should return health check information', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/auth/me');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /nonexistent', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/nonexistent');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Not Found');
    });
  });

  describe('POST /api/auth/register', () => {
    it('should validate request body', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: '123', // Too short
          fullName: 'A', // Too short
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error.message', 'Validation failed');
      expect(response.body.error).toHaveProperty('details');
    });
  });

  describe('POST /api/incomes', () => {
    it('should validate income creation request', async () => {
      const response = await request(app)
        .post('/api/incomes')
        .send({
          amount: -100, // Negative amount
          source: '', // Empty source
          incomeDate: 'invalid-date',
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error.message', 'Validation failed');
    });
  });
});