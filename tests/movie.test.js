import { jest, describe, beforeAll, afterAll, beforeEach, it, expect } from '@jest/globals';
import request from 'supertest';

const mockPrisma = {
  movie: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
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
    verify: jest.fn(() => ({ id: 'admin-user-id' })),
  },
}));

jest.unstable_mockModule('cloudinary', () => ({
  default: {
    v2: {
      config: jest.fn(),
      uploader: {
        upload: jest.fn(() => Promise.resolve({ secure_url: 'https://example.com/poster.jpg' })),
      },
    },
  },
}));

const { default: app } = await import('../app.js');

describe('App-level middleware', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/nonexistent-route');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Route not found');
  });
});

describe('Movie Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnect.mockResolvedValue();
    mockDisconnect.mockResolvedValue();
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'admin-user-id',
      email: 'admin@test.com',
      name: 'Admin',
      Role: 'Admin',
    });
  });

  describe('GET /getallmovie', () => {
    it('should return 401 when no token provided', async () => {
      const res = await request(app).get('/getallmovie');

      expect(res.status).toBe(401);
    });

    it('should return 401 when token has no Bearer prefix', async () => {
      const res = await request(app)
        .get('/getallmovie')
        .set('Authorization', 'Basic some-token');

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('no token');
    });

    it('should return 401 when token is expired or invalid', async () => {
      const jwt = (await import('jsonwebtoken')).default;
      jwt.verify.mockImplementationOnce(() => { throw new Error('jwt expired'); });

      const res = await request(app)
        .get('/getallmovie')
        .set('Authorization', 'Bearer expired-token');

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('expried');
    });

    it('should return 404 when token is valid but user no longer exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get('/getallmovie')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('no user');
    });

    it('should return 200 with movies list', async () => {
      const mockMovies = [
        { id: '1', title: 'Movie 1', releaseYear: 2024, genres: 'Action' },
        { id: '2', title: 'Movie 2', releaseYear: 2023, genres: 'Drama' },
      ];
      mockPrisma.movie.findMany.mockResolvedValue(mockMovies);

      const res = await request(app)
        .get('/getallmovie')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(mockMovies);
    });

    it('should return empty array when no movies exist', async () => {
      mockPrisma.movie.findMany.mockResolvedValue([]);

      const res = await request(app)
        .get('/getallmovie')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('POST /addmovie', () => {
    const validMovie = {
      title: 'New Movie',
      runtime: 120,
      genres: 'Action',
      releaseYear: 2025,
      overvieW: 'A great movie',
    };

    it('should return 401 when no token provided', async () => {
      const res = await request(app)
        .post('/addmovie')
        .send(validMovie);

      expect(res.status).toBe(401);
    });

    it('should return 403 when user is not Admin', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'regular-user-id',
        email: 'user@test.com',
        name: 'User',
        Role: 'User',
      });

      const res = await request(app)
        .post('/addmovie')
        .set('Authorization', 'Bearer valid-token')
        .send(validMovie);

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Access denid');
    });

    it('should return 400 when movie already exists', async () => {
      mockPrisma.movie.findUnique.mockResolvedValue({ id: 'existing-movie', title: 'New Movie' });

      const res = await request(app)
        .post('/addmovie')
        .set('Authorization', 'Bearer valid-token')
        .send(validMovie);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('this movie is exist');
    });

    it('should return 201 on successful movie creation', async () => {
      mockPrisma.movie.findUnique.mockResolvedValue(null);
      mockPrisma.movie.create.mockResolvedValue({ id: 'new-movie', ...validMovie });

      const res = await request(app)
        .post('/addmovie')
        .set('Authorization', 'Bearer valid-token')
        .send(validMovie);

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('created movie');
    });
  });

  describe('DELETE /deletemovie/:id', () => {
    it('should return 404 when movie not found', async () => {
      mockPrisma.movie.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .delete('/deletemovie/nonexistent-id')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('this movie is not found');
    });

    it('should return 200 on successful deletion', async () => {
      mockPrisma.movie.findUnique.mockResolvedValue({ id: 'movie-id', title: 'Movie' });

      const res = await request(app)
        .delete('/deletemovie/movie-id')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('this movie deleted');
    });
  });

  describe('PUT /changeposter/:id', () => {
    it('should return 400 when no file uploaded', async () => {
      mockPrisma.movie.findUnique.mockResolvedValue({ id: 'movie-id', title: 'Movie' });

      const res = await request(app)
        .put('/changeposter/movie-id')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('no file upload');
    });

    it('should return 404 when movie not found', async () => {
      mockPrisma.movie.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .put('/changeposter/nonexistent-id')
        .set('Authorization', 'Bearer valid-token')
        .attach('poster', Buffer.from('fake-image'), 'poster.jpg');

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('this movie is not found');
    });

    it('should return 201 on successful poster update', async () => {
      mockPrisma.movie.findUnique.mockResolvedValue({ id: 'movie-id', title: 'Movie' });
      mockPrisma.movie.update.mockResolvedValue({
        id: 'movie-id',
        posterUrl: 'https://example.com/poster.jpg',
      });

      const res = await request(app)
        .put('/changeposter/movie-id')
        .set('Authorization', 'Bearer valid-token')
        .attach('poster', Buffer.from('fake-image'), 'poster.jpg');

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('poster updated');
    });
  });
});
