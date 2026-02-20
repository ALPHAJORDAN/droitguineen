import { Request, Response } from 'express';
import { uploadService } from '../services/upload.service';
import { asyncHandler, AppError } from '../middlewares/error.middleware';
import { cleanupOnError } from '../middlewares/upload.middleware';
import { validateUploadPath } from '../utils/sanitizer';
import { Nature } from '@prisma/client';

class UploadController {
  /**
   * GET /upload/files - List all uploaded files
   */
  getFiles = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const files = await uploadService.getUploadedFiles(page, limit);

    res.json({
      success: true,
      data: files,
    });
  });

  /**
   * DELETE /upload/files/:id - Delete an uploaded file
   */
  deleteFile = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await uploadService.deleteUploadedFile(id);

    res.json({
      success: true,
      message: 'Fichier supprimé avec succès',
    });
  });

  /**
   * POST /upload/pdf - Upload and process a PDF
   */
  uploadPdf = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new AppError(400, 'Aucun fichier fourni');
    }

    const filePath = req.file.path;

    try {
      // Process the PDF
      const result = await uploadService.processPdf(filePath, req.file.originalname);

      // Get manual metadata if provided
      const {
        cid = `LEGITEXT${Date.now()}`,
        titre = result.metadata.titre,
        nature = result.metadata.nature || 'LOI',
        sousCategorie,
        numero = result.metadata.numero,
        dateSignature = result.metadata.dateSignature?.toISOString(),
        datePublication,
        sourceJO,
        createInDb = 'false',
      } = req.body;

      // If user wants to create directly in database
      if (createInDb === 'true') {
        const texte = await uploadService.createTexteFromPdf({
          cid,
          titre,
          nature: nature as Nature,
          sousCategorie,
          numero,
          dateSignature,
          datePublication,
          sourceJO,
          filePath,
          articles: result.articles,
          sections: result.sections,
        });

        return res.status(201).json({
          success: true,
          message: 'PDF traité et enregistré avec succès',
          data: texte,
          extractionMethod: result.method,
        });
      }

      // Otherwise, return data for preview
      const totalArticles =
        result.articles.length > 0
          ? result.articles.length
          : result.sections.reduce((acc, sec) => acc + uploadService.countArticles(sec), 0);

      res.json({
        success: true,
        message: 'PDF traité avec succès',
        extractionMethod: result.method,
        filePath,
        metadata: {
          titre,
          nature,
          numero,
          dateSignature,
        },
        textPreview: result.text.substring(0, 5000),
        articles: result.articles,
        sections: result.sections,
        isCode: result.isCode,
        fullTextLength: result.text.length,
        articlesCount: totalArticles,
      });
    } catch (error) {
      // Clean up file on processing error
      cleanupOnError(filePath);
      throw error;
    }
  });

  /**
   * POST /upload/confirm - Confirm and save a previewed PDF
   */
  confirmUpload = asyncHandler(async (req: Request, res: Response) => {
    const {
      filePath,
      cid,
      titre,
      nature,
      sousCategorie,
      numero,
      dateSignature,
      datePublication,
      sourceJO,
      articles = [],
      sections = [],
    } = req.body;

    // Validate file path is within upload directory (prevent path traversal)
    validateUploadPath(filePath);

    const texte = await uploadService.createTexteFromPdf({
      cid,
      titre,
      nature: nature as Nature,
      sousCategorie,
      numero,
      dateSignature,
      datePublication,
      sourceJO,
      filePath,
      articles,
      sections,
    });

    res.status(201).json({
      success: true,
      message: 'Texte enregistré avec succès',
      data: texte,
    });
  });
}

export const uploadController = new UploadController();
