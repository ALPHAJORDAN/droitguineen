import { z } from 'zod';
import { UserRoleEnum } from './auth.validator';

export const ProfessionEnum = z.enum([
  'MAGISTRAT', 'AVOCAT', 'JURISTE', 'NOTAIRE', 'EXPERT', 'AUTRE',
]);

export const createInvitationSchema = z.object({
  email: z.string().email('Email invalide'),
  role: UserRoleEnum.default('USER'),
  profession: ProfessionEnum,
});

export const googleLoginSchema = z.object({
  credential: z.string().min(1, 'Token Google requis'),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
