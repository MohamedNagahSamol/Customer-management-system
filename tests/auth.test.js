import { jest, describe, beforeAll, afterAll, beforeEach, it, expect } from '@jest/globals';
import request from 'supertest';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};
const mockConnect = jest.fn();
const mockDisconnect = jest.fn();

jest.unstable_mockModule('../config/prisma.js', () => ({
  prisma: mockPrisma,
  connect: mockConnect,
  disconnect: mockDisconnect,
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    sign: jest.fn(() => 'mocked-access-token'),
    verify: jest.fn(() => ({ id: 'test-user-id' })),
  },
}));

jest.unstable_mockModule('bcrypt', () => ({
  default: {
    hash: jest.fn(() => Promise.resolve('$2b$10$mockedhashedpassword')),
    compare: jest.fn(() => Promise.resolve(true)),
  },
}));

const { default: app } = await import('../app.js');

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnect.mockResolvedValue();
    mockDisconnect.mockResolvedValue();
  });

  describe('Global error handler', () => {
  it('should return 500 when connect() throws', async () => {
    mockConnect.mockRejectedValue(new Error('DB connection failed'));

    const res = await request(app)
      .post('/register')
      .send({ email: 'test@test.com', password: 'Valid@123' });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('DB connection failed');
  });
});

describe('POST /register', () => {
    it('should return 400 when email is invalid', async () => {
      const res = await request(app)
        .post('/register')
        .send({ email: 'not-an-email', password: 'Valid@123' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBeDefined();
      expect(mockConnect).not.toHaveBeenCalled();
    });

    it('should return 400 when password does not meet requirements', async () => {
      const res = await request(app)
        .post('/register')
        .send({ email: 'test@test.com', password: '123' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBeDefined();
    });

    it('should return 401 when email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-id', email: 'test@test.com' });

      const res = await request(app)
        .post('/register')
        .send({ email: 'test@test.com', password: 'Valid@123' });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('this email is exist');
    });

    it('should return 201 on successful registration', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ id: 'new-user-id', email: 'test@test.com', name: 'TestUser' });

      const res = await request(app)
        .post('/register')
        .send({ name: 'TestUser', email: 'test@test.com', password: 'Valid@123' });

      expect(res.status).toBe(201);
      expect(res.body.token).toBe('mocked-access-token');
      expect(res.body.message).toBe('correct signup');
    });
  });

  describe('POST /login', () => {
    it('should return 401 when email does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/login')
        .send({ email: 'nonexistent@test.com', password: 'Valid@123' });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('this email is not exist');
    });

    it('should return 401 when password is wrong', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'test@test.com',
        password: '$2b$10$dummyhashedpassword',
        name: 'TestUser',
        Role: 'User',
      });

      const bcrypt = (await import('bcrypt')).default;
      bcrypt.compare.mockResolvedValueOnce(false);

      const res = await request(app)
        .post('/login')
        .send({ email: 'test@test.com', password: 'WrongPass@1' });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('this password is not correct');
    });

    it('should return 200 on successful login', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'test@test.com',
        password: '$2b$10$dummyhashedpassword',
        name: 'TestUser',
        Role: 'User',
      });

      const res = await request(app)
        .post('/login')
        .send({ email: 'test@test.com', password: 'Valid@123' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('correct login');
      expect(res.body.token).toBe('mocked-access-token');
    });
  });

  describe('GET /logout', () => {
    it('should return 204 when no refresh token cookie', async () => {
      const res = await request(app).get('/logout');

      expect(res.status).toBe(204);
    });

    it('should return 200 on successful logout', async () => {
      const res = await request(app)
        .get('/logout')
        .set('Cookie', ['refreshToken=mocked-refresh-token']);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('logout successfuly');
    });
  });

  describe('GET /refresh', () => {
    it('should return 204 when no refresh token cookie', async () => {
      const res = await request(app).get('/refresh');

      expect(res.status).toBe(204);
    });

    it('should return 200 with new access token', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'test@test.com',
        name: 'TestUser',
      });

      const res = await request(app)
        .get('/refresh')
        .set('Cookie', ['refreshToken=valid-refresh-token']);

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
    });

    it('should return 404 when user not found after refresh', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get('/refresh')
        .set('Cookie', ['refreshToken=valid-refresh-token']);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('no user');
    });
  });
});
