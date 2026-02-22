import { OAuth2Client } from 'google-auth-library';
import { config } from '../config';
import { AppError } from '../middlewares/error.middleware';
import { userRepository } from '../repositories/user.repository';
import { invitationRepository } from '../repositories/invitation.repository';
import { authService } from './auth.service';
import { log } from '../utils/logger';

class GoogleAuthService {
  private client: OAuth2Client;

  constructor() {
    this.client = new OAuth2Client(config.google.clientId);
  }

  async verifyGoogleToken(idToken: string) {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: config.google.clientId,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email || !payload.email_verified) {
        throw new AppError(401, 'Token Google invalide ou email non vérifié');
      }
      return {
        googleId: payload.sub,
        email: payload.email,
        nom: payload.family_name || '',
        prenom: payload.given_name || '',
        avatarUrl: payload.picture || undefined,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      log.error('Google token verification failed', error instanceof Error ? error : undefined);
      throw new AppError(401, 'Token Google invalide');
    }
  }

  async loginWithGoogle(idToken: string) {
    const profile = await this.verifyGoogleToken(idToken);

    // Case 1: Existing user with this googleId -> login directly
    const existingByGoogleId = await userRepository.findByGoogleId(profile.googleId);
    if (existingByGoogleId) {
      if (!existingByGoogleId.isActive) {
        throw new AppError(403, 'Compte désactivé');
      }
      return authService.issueTokensForUser(existingByGoogleId);
    }

    // Case 2: Existing user with this email -> link Google account
    const existingByEmail = await userRepository.findByEmail(profile.email);
    if (existingByEmail) {
      if (!existingByEmail.isActive) {
        throw new AppError(403, 'Compte désactivé');
      }
      const updated = await userRepository.update(existingByEmail.id, {
        googleId: profile.googleId,
        avatarUrl: profile.avatarUrl,
      });
      return authService.issueTokensForUser(updated);
    }

    // Case 3: Check for pending invitation
    const invitation = await invitationRepository.findPendingByEmail(profile.email);
    if (!invitation) {
      throw new AppError(403, 'Aucune invitation trouvée pour cet email. Contactez un administrateur.');
    }

    // Create new user from invitation + Google profile
    const newUser = await userRepository.create({
      email: profile.email,
      nom: profile.nom || profile.email.split('@')[0],
      prenom: profile.prenom || '',
      role: invitation.role,
      profession: invitation.profession,
      authProvider: 'GOOGLE',
      googleId: profile.googleId,
      avatarUrl: profile.avatarUrl,
      isActive: true,
    });

    // Mark invitation as accepted
    await invitationRepository.updateStatus(invitation.id, 'ACCEPTED', new Date());

    log.info('New user created via Google OAuth', { email: profile.email, role: invitation.role });

    return authService.issueTokensForUser(newUser);
  }
}

export const googleAuthService = new GoogleAuthService();
