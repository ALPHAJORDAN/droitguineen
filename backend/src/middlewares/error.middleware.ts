import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // Import logger dynamically to avoid circular dependencies
  const logError = (data: object) => {
    try {
      const { logger } = require('../utils/logger');
      logger.error(data);
    } catch {
      console.error(data);
    }
  };

  logError({
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // Application Error
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      details: error.details,
    });
  }

  // Zod Validation Error
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Erreur de validation',
      details: error.issues.map((e: z.ZodIssue) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Prisma Errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return res.status(409).json({
          success: false,
          error: 'Conflit - Cette donnée existe déjà',
          details: error.meta,
        });
      case 'P2025':
        return res.status(404).json({
          success: false,
          error: 'Ressource non trouvée',
        });
      case 'P2003':
        return res.status(400).json({
          success: false,
          error: 'Contrainte de clé étrangère violée',
        });
      default:
        return res.status(500).json({
          success: false,
          error: 'Erreur base de données',
          code: error.code,
        });
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      error: 'Données invalides pour la base de données',
    });
  }

  // Multer Errors
  if (error.name === 'MulterError') {
    const multerError = error as any;
    if (multerError.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: 'Fichier trop volumineux',
      });
    }
    return res.status(400).json({
      success: false,
      error: `Erreur upload: ${multerError.message}`,
    });
  }

  // Generic Error
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(500).json({
    success: false,
    error: isProduction ? 'Erreur interne du serveur' : error.message,
    ...(isProduction ? {} : { stack: error.stack }),
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.url} non trouvée`,
  });
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
