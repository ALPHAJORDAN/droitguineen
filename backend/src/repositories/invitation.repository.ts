import prisma from '../lib/prisma';
import { InvitationStatus, Profession, UserRole } from '@prisma/client';

class InvitationRepository {
  async create(data: {
    email: string;
    role: UserRole;
    profession: Profession;
    invitedById: string;
  }) {
    return prisma.invitation.create({
      data,
      include: {
        invitedBy: { select: { nom: true, prenom: true } },
      },
    });
  }

  async findPendingByEmail(email: string) {
    return prisma.invitation.findFirst({
      where: { email, status: 'PENDING' },
    });
  }

  async findAll(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [invitations, total] = await Promise.all([
      prisma.invitation.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          invitedBy: { select: { nom: true, prenom: true } },
        },
      }),
      prisma.invitation.count(),
    ]);

    return {
      data: invitations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async updateStatus(id: string, status: InvitationStatus, acceptedAt?: Date) {
    return prisma.invitation.update({
      where: { id },
      data: { status, acceptedAt },
    });
  }

  async findById(id: string) {
    return prisma.invitation.findUnique({ where: { id } });
  }
}

export const invitationRepository = new InvitationRepository();
