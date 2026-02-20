import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import type { Application } from 'express';

// Mock dependencies
vi.mock('../../src/lib/meilisearch', () => ({
  initMeiliSearch: vi.fn().mockResolvedValue(undefined),
  indexTexte: vi.fn().mockResolvedValue(undefined),
  removeTexteFromIndex: vi.fn().mockResolvedValue(undefined),
  meiliClient: { health: vi.fn().mockResolvedValue({ status: 'available' }) },
}));

vi.mock('../../src/lib/prisma', () => ({
  default: { $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]) },
}));

describe('API Base Routes', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
      expect(response.body.checks).toBeDefined();
      expect(response.body.checks.database).toBe('ok');
      expect(response.body.checks.meilisearch).toBe('ok');
    });
  });

  describe('GET /', () => {
    it('should return API info', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body.message).toContain('Droitguin');
      expect(response.body.version).toBe('1.0.0');
      expect(response.body.endpoints).toBeDefined();
      expect(response.body.endpoints.lois).toBe('/lois');
      expect(response.body.endpoints.recherche).toBe('/recherche');
      expect(response.body.endpoints.upload).toBe('/upload');
      expect(response.body.endpoints.export).toBe('/export');
      expect(response.body.endpoints.relations).toBe('/relations');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/unknown-route')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('non trouvée');
    });

    it('should return 404 for unknown POST routes', async () => {
      const response = await request(app)
        .post('/unknown-route')
        .send({ test: true })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Helmet headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    });
  });

  describe('Validation Errors', () => {
    it('should return validation error for invalid query params on /lois', async () => {
      const response = await request(app)
        .get('/lois?page=0')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Erreur de validation');
      expect(response.body.details).toBeDefined();
    });

    it('should return validation error for limit over 100', async () => {
      const response = await request(app)
        .get('/lois?limit=500')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return validation error for invalid nature filter', async () => {
      const response = await request(app)
        .get('/lois?nature=INVALID')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('ID Validation', () => {
    it('should return 400 for invalid UUID on /lois/:id', async () => {
      const response = await request(app)
        .get('/lois/invalid-uuid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('invalide');
    });

    it('should return 401 for invalid UUID on DELETE without auth', async () => {
      const response = await request(app)
        .delete('/lois/not-a-uuid')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Body Validation', () => {
    it('should return 401 for POST /lois without auth', async () => {
      const response = await request(app)
        .post('/lois')
        .send({ titre: 'Only title provided' })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should return 401 for POST /lois with invalid nature without auth', async () => {
      const response = await request(app)
        .post('/lois')
        .send({
          cid: 'TEST',
          titre: 'Test title',
          nature: 'INVALID_NATURE',
        })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should return 401 for POST /lois with short titre without auth', async () => {
      const response = await request(app)
        .post('/lois')
        .send({
          cid: 'TEST',
          titre: 'AB',
          nature: 'LOI',
        })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });
});
