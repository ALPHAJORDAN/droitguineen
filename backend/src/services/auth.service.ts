import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { UserRole } from '@prisma/client';
import { config } from '../config';
import { AppError } from '../middlewares/error.middleware';
import { userRepository } from '../repositories/user.repository';
import prisma from '../lib/prisma';
import { CreateUserInput, UpdateUserInput, ChangePasswordInput } from '../validators/auth.validator';
import { JwtPayload } from '../middlewares/auth.middleware';

const BCRYPT_ROUNDS = 12;

class AuthService {
  private generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as any,
    });
  }

  private generateRefreshToken(): string {
    return crypto.randomBytes(48).toString('hex');
  }

  private getRefreshExpiresAt(): Date {
    const match = config.jwt.refreshExpiresIn.match(/^(\d+)([dhms])$/);
    if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7d default

    const [, value, unit] = match;
    const ms = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    }[unit]!;

    return new Date(Date.now() + parseInt(value) * ms);
  }

  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);

    if (!user || !user.password) {
      // Constant-time: run bcrypt even if user not found to prevent timing-based enumeration
      await bcrypt.hash(password, BCRYPT_ROUNDS);
      throw new AppError(401, 'Email ou mot de passe incorrect');
    }

    if (!user.isActive) {
      throw new AppError(403, 'Compte désactivé');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError(401, 'Email ou mot de passe incorrect');
    }

    return this.issueTokensForUser(user);
  }

  /**
   * Issue JWT access + refresh tokens for a user (used by both local and Google auth).
   */
  async issueTokensForUser(user: { id: string; email: string; role: UserRole; password?: string | null; [key: string]: unknown }) {
    const tokenPayload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.generateAccessToken(tokenPayload);
    const refreshToken = this.generateRefreshToken();

    await userRepository.createRefreshToken({
      token: refreshToken,
      userId: user.id,
      expiresAt: this.getRefreshExpiresAt(),
    });

    const { password: _, ...userWithoutPassword } = user;

    return {
      accessToken,
      refreshToken,
      user: userWithoutPassword,
    };
  }

  async refreshToken(token: string) {
    const storedToken = await userRepository.findRefreshToken(token);

    if (!storedToken) {
      throw new AppError(401, 'Refresh token invalide');
    }

    if (storedToken.expiresAt < new Date()) {
      await userRepository.deleteRefreshTokensByUserId(storedToken.userId);
      throw new AppError(401, 'Refresh token expiré');
    }

    if (!storedToken.user || !storedToken.user.isActive) {
      throw new AppError(403, 'Compte désactivé');
    }

    const tokenPayload: JwtPayload = {
      id: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
    };

    const accessToken = this.generateAccessToken(tokenPayload);

    return { accessToken };
  }

  async logout(userId: string) {
    await userRepository.deleteRefreshTokensByUserId(userId);
  }

  async getMe(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError(404, 'Utilisateur non trouvé');
    }
    return user;
  }

  async createUser(data: CreateUserInput) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new AppError(409, 'Un utilisateur avec cet email existe déjà');
    }

    const hashedPassword = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

    return userRepository.create({
      email: data.email,
      password: hashedPassword,
      nom: data.nom,
      prenom: data.prenom,
      role: data.role as UserRole,
    });
  }

  async getAllUsers(page: number = 1, limit: number = 20) {
    return userRepository.findAll(page, limit);
  }

  async updateUser(id: string, data: UpdateUserInput) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError(404, 'Utilisateur non trouvé');
    }

    return userRepository.update(id, data);
  }

  async deleteUser(id: string, requesterId: string) {
    if (id === requesterId) {
      throw new AppError(400, 'Vous ne pouvez pas supprimer votre propre compte');
    }

    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError(404, 'Utilisateur non trouvé');
    }

    // Cascade delete handles refresh tokens automatically
    await userRepository.delete(id);
  }

  async changePassword(userId: string, data: ChangePasswordInput) {
    const user = await userRepository.findByIdWithPassword(userId);
    if (!user) {
      throw new AppError(404, 'Utilisateur non trouvé');
    }

    if (!user.password) {
      throw new AppError(400, 'Ce compte utilise Google pour se connecter');
    }

    const isOldPasswordValid = await bcrypt.compare(data.oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new AppError(401, 'Ancien mot de passe incorrect');
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, BCRYPT_ROUNDS);

    // Atomic: update password + invalidate all refresh tokens
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { password: hashedPassword } });
      await tx.refreshToken.deleteMany({ where: { userId } });
    });
  }
}

export const authService = new AuthService();
