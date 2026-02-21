import { z } from 'zod';

export const CategorieLivreEnum = z.enum([
  'DROIT',
  'PHILOSOPHIE',
  'POLITIQUE',
  'ECONOMIE',
]);

export const createLivreSchema = z.object({
  titre: z.string().min(1, 'Titre requis').max(500, 'Titre trop long'),
  auteur: z.string().min(1, 'Auteur requis').max(200, 'Nom d\'auteur trop long'),
  editeur: z.string().max(200).optional().nullable(),
  anneePublication: z.coerce.number().int().min(1800).max(2100).optional().nullable(),
  isbn: z.string().max(20).optional().nullable(),
  resume: z.string().max(5000).optional().nullable(),
  categorie: CategorieLivreEnum,
  couverture: z.string().max(500).optional().nullable(),
  fichierPdf: z.string().max(500).optional().nullable(),
  chapitres: z.array(z.object({
    titre: z.string().min(1),
    contenu: z.string().min(1),
    ordre: z.number().int().min(0),
  })).optional(),
});

export const updateLivreSchema = z.object({
  titre: z.string().min(1).max(500).optional(),
  auteur: z.string().min(1).max(200).optional(),
  editeur: z.string().max(200).optional().nullable(),
  anneePublication: z.coerce.number().int().min(1800).max(2100).optional().nullable(),
  isbn: z.string().max(20).optional().nullable(),
  resume: z.string().max(5000).optional().nullable(),
  categorie: CategorieLivreEnum.optional(),
  couverture: z.string().max(500).optional().nullable(),
  fichierPdf: z.string().max(500).optional().nullable(),
});

export const queryLivreSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  categorie: CategorieLivreEnum.optional(),
  auteur: z.string().max(200).optional(),
  sort: z.enum(['anneePublication', 'createdAt', 'titre', 'auteur']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});
