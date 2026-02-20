import { z } from 'zod';
import { NatureEnum, EtatTexteEnum } from './loi.validator';

// Upload PDF schema
export const uploadPdfSchema = z.object({
  // Optional metadata that can be sent with the file
  titre: z.string().min(3).max(500).optional(),
  nature: NatureEnum.optional(),
  numero: z.string().max(50).optional(),
  dateSignature: z.string().datetime().optional(),
  datePublication: z.string().datetime().optional(),
  etat: EtatTexteEnum.optional(),
  sousCategorie: z.string().max(100).optional(),

  // OCR options
  forceOcr: z.coerce.boolean().default(false),
  ocrLanguage: z.enum(['fra', 'eng', 'fra+eng']).default('fra'),
  extractArticles: z.coerce.boolean().default(true),
});

// Article schema for confirm upload
const articleSchema = z.object({
  numero: z.string().min(1).max(50),
  contenu: z.string().min(1),
  ordre: z.number().int().min(0).optional(),
  etat: EtatTexteEnum.optional(),
});

// Recursive section schema with max depth of 6 to prevent DoS
function createSectionSchema(depth: number = 0): z.ZodType<any> {
  return z.object({
    titre: z.string().min(1).max(500),
    articles: z.array(articleSchema).default([]),
    enfants: depth < 6
      ? z.lazy(() => z.array(createSectionSchema(depth + 1))).default([])
      : z.array(z.never()).max(0).default([]),
  });
}
const sectionSchema = createSectionSchema();

// Confirm upload schema - validates the full body for /upload/confirm
export const confirmUploadSchema = z.object({
  filePath: z.string().min(1),
  cid: z.string().min(1).max(100),
  titre: z.string().min(3).max(500),
  nature: NatureEnum,
  sousCategorie: z.string().max(100).optional(),
  numero: z.string().max(50).optional(),
  dateSignature: z.string().datetime().optional(),
  datePublication: z.string().datetime().optional(),
  sourceJO: z.string().max(200).optional(),
  articles: z.array(articleSchema).default([]),
  sections: z.array(sectionSchema).default([]),
});

// Types exports
export type UploadPdfInput = z.infer<typeof uploadPdfSchema>;
export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>;
