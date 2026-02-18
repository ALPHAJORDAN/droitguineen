import { z } from 'zod';

// Enums matching Prisma schema
export const NatureEnum = z.enum([
  'LOI',
  'LOI_ORGANIQUE',
  'LOI_CONSTITUTIONNELLE',
  'ORDONNANCE',
  'DECRET',
  'DECRET_LOI',
  'ARRETE',
  'CIRCULAIRE',
  'DECISION',
  'CONVENTION',
  'TRAITE',
  'CODE',
  'JURISPRUDENCE',
  'AUTRE',
]);

export const EtatTexteEnum = z.enum([
  'VIGUEUR',
  'VIGUEUR_DIFF',
  'MODIFIE',
  'ABROGE',
  'ABROGE_DIFF',
  'PERIME',
]);

export const EtatArticleEnum = z.enum([
  'VIGUEUR',
  'VIGUEUR_DIFF',
  'MODIFIE',
  'ABROGE',
  'PERIME',
]);

// Article schema
const articleSchema = z.object({
  numero: z.string().min(1, 'Numéro d\'article requis'),
  contenu: z.string().min(10, 'Le contenu doit faire au moins 10 caractères'),
  etat: EtatArticleEnum.optional(),
  dateDebut: z.string().datetime().optional(),
  dateFin: z.string().datetime().optional(),
});

// Section schema
const sectionSchema = z.object({
  titre: z.string().min(1, 'Titre de section requis'),
  niveau: z.number().int().min(1).max(10),
  ordre: z.number().int().min(0),
});

// Create Loi schema
export const createLoiSchema = z.object({
  cid: z.string().min(1, 'CID requis').max(100),
  nor: z
    .string()
    .length(12, 'Le NOR doit faire exactement 12 caractères')
    .regex(/^[A-Z0-9]+$/, 'Le NOR ne doit contenir que des lettres majuscules et chiffres')
    .optional()
    .nullable(),
  eli: z.string().url('ELI doit être une URL valide').optional().nullable(),
  titre: z.string().min(3, 'Titre trop court').max(500, 'Titre trop long'),
  titreComplet: z.string().max(2000).optional().nullable(),
  nature: NatureEnum,
  numero: z.string().max(50).optional().nullable(),
  dateSignature: z.string().datetime().optional().nullable(),
  datePublication: z.string().datetime().optional().nullable(),
  dateEntreeVigueur: z.string().datetime().optional().nullable(),
  etat: EtatTexteEnum.default('VIGUEUR'),
  visas: z.string().max(10000).optional().nullable(),
  signataires: z.string().max(1000).optional().nullable(),
  sourceJO: z.string().max(200).optional().nullable(),
  urlJO: z.string().url().optional().nullable(),
  sousCategorie: z.string().max(100).optional().nullable(),
  articles: z.array(articleSchema).optional(),
  sections: z.array(sectionSchema).optional(),
});

// Update Loi schema (all fields optional)
export const updateLoiSchema = createLoiSchema.partial().omit({ cid: true });

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  nature: NatureEnum.optional(),
  etat: EtatTexteEnum.optional(),
  sousCategorie: z.string().optional(),
  dateDebut: z.string().datetime().optional(),
  dateFin: z.string().datetime().optional(),
  sort: z
    .enum(['datePublication', 'dateSignature', 'createdAt', 'titre', 'numero'])
    .default('datePublication'),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().max(500).optional(),
});

// Search schema
export const searchSchema = z.object({
  q: z.string().min(1, 'Requête de recherche requise').max(500),
  nature: NatureEnum.optional(),
  etat: EtatTexteEnum.optional(),
  dateDebut: z.string().datetime().optional(),
  dateFin: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ID parameter schema
export const idParamSchema = z.object({
  id: z.string().uuid('ID invalide'),
});

// Types exports
export type CreateLoiInput = z.infer<typeof createLoiSchema>;
export type UpdateLoiInput = z.infer<typeof updateLoiSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
