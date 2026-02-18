import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { config } from '../config';
import { AppError } from './error.middleware';

export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user: JwtPayload;
}

/**
 * Middleware d'authentification JWT.
 * Extrait et vérifie le token Bearer du header Authorization.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError(401, 'Token d\'authentification requis');
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
    (req as AuthRequest).user = payload;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(401, 'Token expiré');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError(401, 'Token invalide');
    }
    throw new AppError(401, 'Échec de l\'authentification');
  }
}

/**
 * Middleware d'autorisation par rôle.
 * Doit être utilisé après `authenticate`.
 */
export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as AuthRequest).user;

    if (!user) {
      throw new AppError(401, 'Authentification requise');
    }

    if (!roles.includes(user.role)) {
      throw new AppError(403, 'Permissions insuffisantes');
    }

    next();
  };
}
