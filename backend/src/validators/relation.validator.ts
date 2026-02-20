import { z } from 'zod';

// TypeRelation enum matching Prisma schema
export const TypeRelationEnum = z.enum([
  'ABROGE',
  'ABROGE_PARTIELLEMENT',
  'MODIFIE',
  'COMPLETE',
  'CITE',
  'APPLIQUE',
  'PROROGE',
  'SUSPEND',
  'RATIFIE',
  'CODIFIE',
  'CONSOLIDE',
]);

// Base relation schema without refinement
const baseRelationSchema = z.object({
  type: TypeRelationEnum,
  texteSourceId: z.string().uuid('ID du texte source invalide'),
  texteCibleId: z.string().uuid('ID du texte cible invalide'),
  articleCibleNum: z.string().max(20).optional().nullable(),
  articleSourceNum: z.string().max(20).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  dateEffet: z.string().datetime().optional().nullable(),
});

// Create relation schema with self-reference check
export const createRelationSchema = baseRelationSchema.refine(
  (data) => data.texteSourceId !== data.texteCibleId,
  { message: 'Un texte ne peut pas avoir une relation avec lui-même' }
);

// Update relation schema (partial, without IDs)
export const updateRelationSchema = z.object({
  type: TypeRelationEnum.optional(),
  articleCibleNum: z.string().max(20).optional().nullable(),
  articleSourceNum: z.string().max(20).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  dateEffet: z.string().datetime().optional().nullable(),
});

// Detect relations schema
export const detectRelationsSchema = z.object({
  texteId: z.string().uuid('ID du texte invalide'),
});

// Types exports
export type CreateRelationInput = z.infer<typeof createRelationSchema>;
export type UpdateRelationInput = z.infer<typeof updateRelationSchema>;
export type DetectRelationsInput = z.infer<typeof detectRelationsSchema>;
