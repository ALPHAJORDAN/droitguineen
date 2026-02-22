import { Profession, UserRole } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware';
import { invitationRepository } from '../repositories/invitation.repository';
import { userRepository } from '../repositories/user.repository';
import { sendInvitationEmail } from './email.service';

class InvitationService {
  async createInvitation(data: {
    email: string;
    role: string;
    profession: string;
  }, invitedById: string) {
    // Check no existing active user with that email
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new AppError(409, 'Un utilisateur avec cet email existe déjà');
    }

    // Check no existing PENDING invitation for that email
    const existingInvitation = await invitationRepository.findPendingByEmail(data.email);
    if (existingInvitation) {
      throw new AppError(409, 'Une invitation est déjà en attente pour cet email');
    }

    const invitation = await invitationRepository.create({
      email: data.email,
      role: data.role as UserRole,
      profession: data.profession as Profession,
      invitedById,
    });

    // Send invitation email (non-blocking — don't fail if email fails)
    await sendInvitationEmail(invitation);

    return invitation;
  }

  async listInvitations(page: number = 1, limit: number = 20) {
    return invitationRepository.findAll(page, limit);
  }

  async revokeInvitation(id: string) {
    const invitation = await invitationRepository.findById(id);
    if (!invitation) {
      throw new AppError(404, 'Invitation non trouvée');
    }
    if (invitation.status !== 'PENDING') {
      throw new AppError(400, 'Seules les invitations en attente peuvent être révoquées');
    }

    return invitationRepository.updateStatus(id, 'REVOKED');
  }
}

export const invitationService = new InvitationService();
