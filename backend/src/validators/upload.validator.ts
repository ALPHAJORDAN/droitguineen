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

// Upload result schema (for validation of response)
export const uploadResultSchema = z.object({
  success: z.boolean(),
  texteId: z.string().uuid().optional(),
  message: z.string().optional(),
  extractedText: z.string().optional(),
  ocrUsed: z.boolean().optional(),
  ocrMethod: z.string().optional(),
  pageCount: z.number().optional(),
  confidence: z.number().optional(),
  warnings: z.array(z.string()).optional(),
});

// File validation schema
export const fileValidationSchema = z.object({
  mimetype: z.literal('application/pdf'),
  size: z.number().max(52428800, 'Le fichier ne doit pas dépasser 50 Mo'),
  originalname: z.string().refine(
    (name) => name.toLowerCase().endsWith('.pdf'),
    { message: 'Le fichier doit avoir une extension .pdf' }
  ),
});

// OCR job status schema
export const ocrJobStatusSchema = z.object({
  jobId: z.string(),
});

// Types exports
export type UploadPdfInput = z.infer<typeof uploadPdfSchema>;
export type UploadResult = z.infer<typeof uploadResultSchema>;
export type FileValidation = z.infer<typeof fileValidationSchema>;
