import { jest, describe, beforeAll, afterAll, beforeEach, it, expect } from '@jest/globals';
import request from 'supertest';

const mockPrisma = {
  movie: {
    findUnique: jest.fn(),
  },
  watchListItem: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
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
    sign: jest.fn(() => 'mocked-token'),
    verify: jest.fn(() => ({ id: 'test-user-id' })),
  },
}));

const { default: app } = await import('../app.js');

describe('Watchlist Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnect.mockResolvedValue();
    mockDisconnect.mockResolvedValue();

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'test-user-id',
      email: 'user@test.com',
      name: 'TestUser',
      Role: 'User',
    });
  });

  describe('POST /addtowatchlist', () => {
    const validEntry = {
      moveiId: 'movie-id',
      notes: 'Great movie',
      rating: 5,
      status: 'PLANNED',
    };

    it('should return 401 when no token provided', async () => {
      const res = await request(app)
        .post('/addtowatchlist')
        .send(validEntry);

      expect(res.status).toBe(401);
    });

    it('should return 404 when movie not found', async () => {
      mockPrisma.movie.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/addtowatchlist')
        .set('Authorization', 'Bearer valid-token')
        .send(validEntry);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('movie not found');
    });

    it('should return 400 when movie already in watchlist', async () => {
      mockPrisma.movie.findUnique.mockResolvedValue({ id: 'movie-id', title: 'Movie' });
      mockPrisma.watchListItem.findUnique.mockResolvedValue({
        id: 'existing-entry',
        movieId: 'movie-id',
        userId: 'test-user-id',
      });

      const res = await request(app)
        .post('/addtowatchlist')
        .set('Authorization', 'Bearer valid-token')
        .send(validEntry);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('movie is already is exist');
    });

    it('should return 201 on successful add to watchlist', async () => {
      mockPrisma.movie.findUnique.mockResolvedValue({ id: 'movie-id', title: 'Movie' });
      mockPrisma.watchListItem.findUnique.mockResolvedValue(null);
      mockPrisma.watchListItem.create.mockResolvedValue({
        id: 'new-entry',
        userId: 'test-user-id',
        movieId: 'movie-id',
        notes: 'Great movie',
        rating: 5,
        status: 'PLANNED',
      });

      const res = await request(app)
        .post('/addtowatchlist')
        .set('Authorization', 'Bearer valid-token')
        .send(validEntry);

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('movie added to watchlist');
    });

    it('should default status to PLANNED when not provided', async () => {
      mockPrisma.movie.findUnique.mockResolvedValue({ id: 'movie-id', title: 'Movie' });
      mockPrisma.watchListItem.findUnique.mockResolvedValue(null);
      mockPrisma.watchListItem.create.mockResolvedValue({
        id: 'new-entry',
        status: 'PLANNED',
      });

      const res = await request(app)
        .post('/addtowatchlist')
        .set('Authorization', 'Bearer valid-token')
        .send({ moveiId: 'movie-id' });

      expect(res.status).toBe(201);
    });
  });

  describe('DELETE /deletefromwatchlist/:id', () => {
    it('should return 404 when watchlist item not found', async () => {
      mockPrisma.watchListItem.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .delete('/deletefromwatchlist/nonexistent-id')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Watchlist item not found');
    });

    it('should return 403 when user does not own the watchlist item', async () => {
      mockPrisma.watchListItem.findUnique.mockResolvedValue({
        id: 'item-id',
        userId: 'other-user-id',
        movieId: 'movie-id',
      });

      const res = await request(app)
        .delete('/deletefromwatchlist/item-id')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('not allow update or delete from this watchlist');
    });

    it('should return 200 on successful deletion from watchlist', async () => {
      mockPrisma.watchListItem.findUnique.mockResolvedValue({
        id: 'item-id',
        userId: 'test-user-id',
        movieId: 'movie-id',
      });

      const res = await request(app)
        .delete('/deletefromwatchlist/item-id')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('this movie deleted from watchlist');
    });
  });
});
