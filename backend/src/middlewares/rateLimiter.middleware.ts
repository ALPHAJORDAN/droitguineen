import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX || '100');

// Error response format
const createLimitMessage = (retryAfter: number) => ({
  success: false,
  error: 'Trop de requêtes, veuillez réessayer plus tard',
  retryAfter: Math.ceil(retryAfter / 1000),
});

/**
 * General rate limiter - applies to all routes
 * 100 requests per 15 minutes by default
 */
export const generalLimiter = rateLimit({
  windowMs,
  max: maxRequests,
  message: createLimitMessage(windowMs),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json(createLimitMessage(windowMs));
  },
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
});

/**
 * Strict rate limiter for sensitive operations
 * 10 requests per hour
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: createLimitMessage(60 * 60 * 1000),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: "Limite d'opérations sensibles atteinte",
      retryAfter: 3600,
    });
  },
});

/**
 * Upload rate limiter
 * 20 uploads per hour
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: createLimitMessage(60 * 60 * 1000),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: "Limite d'uploads atteinte, veuillez réessayer dans une heure",
      retryAfter: 3600,
    });
  },
});

/**
 * Search rate limiter
 * 30 searches per minute
 */
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: createLimitMessage(60 * 1000),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Trop de recherches, veuillez patienter',
      retryAfter: 60,
    });
  },
});

/**
 * Auth rate limiter (login/refresh)
 * 10 attempts per 15 minutes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: createLimitMessage(15 * 60 * 1000),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes',
      retryAfter: 900,
    });
  },
});

/**
 * Export rate limiter
 * 50 exports per hour
 */
export const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: createLimitMessage(60 * 60 * 1000),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: "Limite d'exports atteinte",
      retryAfter: 3600,
    });
  },
});
