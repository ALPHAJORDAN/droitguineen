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

// Types exports
export type UploadPdfInput = z.infer<typeof uploadPdfSchema>;
