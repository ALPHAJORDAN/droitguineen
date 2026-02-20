import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

const isDev = process.env.NODE_ENV !== 'production';
const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes
const maxRequests = isDev ? 10000 : parseInt(process.env.RATE_LIMIT_MAX || '100');

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
 * Upload rate limiter
 * 20 uploads per hour
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
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
 * Password change rate limiter
 * 5 attempts per hour
 */
export const passwordChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Trop de tentatives de changement de mot de passe, réessayez dans une heure',
      retryAfter: 3600,
    });
  },
});

/**
 * Lois rate limiter
 * 60 requests per minute
 */
export const loisLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isDev ? 10000 : 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Trop de requêtes sur les textes, veuillez patienter',
      retryAfter: 60,
    });
  },
});

/**
 * Relations rate limiter
 * 30 requests per minute
 */
export const relationsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isDev ? 10000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Trop de requêtes sur les relations, veuillez patienter',
      retryAfter: 60,
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
