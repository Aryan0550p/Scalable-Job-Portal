const request = require('supertest');
const app = require('../src/server');

describe('Health Check', () => {
  it('should return 200 OK', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'OK');
  });
});

describe('Auth API', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Test123!@#',
        full_name: 'Test User',
        role: 'job_seeker',
      });
    
    expect([201, 400]).toContain(res.statusCode);
  });
});
