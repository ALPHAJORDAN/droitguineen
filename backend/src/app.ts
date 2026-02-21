import express, { Application, Request, Response, NextFunction } from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { generalLimiter, searchLimiter, uploadLimiter, exportLimiter, authLimiter, loisLimiter, relationsLimiter } from './middlewares/rateLimiter.middleware';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { requestLogger, logger } from './utils/logger';
import { swaggerSpec } from './config/swagger';
import { config } from './config';

// Routes
import authRouter from './routes/auth';
import loisRouter from './routes/lois';
import rechercheRouter from './routes/recherche';
import uploadRouter from './routes/upload';
import exportRouter from './routes/export';
import relationsRouter from './routes/relations';
import livresRouter from './routes/livres';
import { userRepository } from './repositories/user.repository';
import prisma from './lib/prisma';
import { meiliClient } from './lib/meilisearch';

export function createApp(): Application {
  const app = express();

  // Trust proxy (for rate limiting behind reverse proxy)
  app.set('trust proxy', 1);

  // Security middlewares
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // CORS configuration
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  app.use(
    cors({
      origin: corsOrigin.split(',').map((o) => o.trim()),
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true,
      maxAge: 86400, // 24 hours
    })
  );

  // Gzip compression
  app.use(compression());

  // Request logging
  app.use(requestLogger);

  // General rate limiting
  app.use(generalLimiter);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check (before other routes, no rate limiting needed)
  app.get('/health', async (req, res) => {
    const checks: Record<string, 'ok' | 'error'> = {};
    const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
      Promise.race([promise, new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);

    // Check database connectivity (5s timeout)
    try {
      await withTimeout(prisma.$queryRaw`SELECT 1`, 5000);
      checks.database = 'ok';
    } catch {
      checks.database = 'error';
    }

    // Check Meilisearch connectivity (5s timeout)
    try {
      await withTimeout(meiliClient.health(), 5000);
      checks.meilisearch = 'ok';
    } catch {
      checks.meilisearch = 'error';
    }

    const allHealthy = Object.values(checks).every(v => v === 'ok');

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
    });
  });

  // API info
  app.get('/', (req, res) => {
    res.json({
      message: 'Droitguinéen API',
      version: '1.0.0',
      documentation: '/docs',
      endpoints: {
        auth: '/auth',
        lois: '/lois',
        recherche: '/recherche',
        upload: '/upload',
        export: '/export',
        relations: '/relations',
        health: '/health',
      },
    });
  });

  // Swagger documentation (disabled in production)
  if (!config.isProduction) {
    app.use(
      '/docs',
      (req: Request, res: Response, next: NextFunction) => {
        res.setHeader(
          'Content-Security-Policy',
          "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data: https://validator.swagger.io"
        );
        next();
      },
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Droitguinéen API Documentation',
      })
    );

    // JSON spec endpoint
    app.get('/docs/spec.json', (req, res) => {
      res.json(swaggerSpec);
    });
  }

  // Routes with specific rate limiters
  app.use('/auth', authLimiter, authRouter);
  app.use('/lois', loisLimiter, loisRouter);
  app.use('/livres', loisLimiter, livresRouter);
  app.use('/recherche', searchLimiter, rechercheRouter);
  app.use('/upload', uploadLimiter, uploadRouter);
  app.use('/export', exportLimiter, exportRouter);
  app.use('/relations', relationsLimiter, relationsRouter);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler (must be last)
  app.use(errorHandler);

  // Cleanup expired refresh tokens every hour (with error tracking)
  let tokenCleanupFailures = 0;
  let isCleaningUp = false;
  setInterval(async () => {
    if (isCleaningUp) return;
    isCleaningUp = true;
    try {
      const result = await userRepository.deleteExpiredTokens();
      tokenCleanupFailures = 0;
      if (result.count > 0) {
        logger.info(`Cleaned up ${result.count} expired refresh tokens`);
      }
    } catch (err) {
      tokenCleanupFailures++;
      logger.error({ err, consecutiveFailures: tokenCleanupFailures }, 'Failed to cleanup expired tokens');
    } finally {
      isCleaningUp = false;
    }
  }, 60 * 60 * 1000);

  return app;
}

export default createApp;
