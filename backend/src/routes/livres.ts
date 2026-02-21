import { Router, Request, Response } from 'express';
import { validate, validateId } from '../middlewares/validation.middleware';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { createLivreSchema, updateLivreSchema, queryLivreSchema } from '../validators/livre.validator';
import { asyncHandler, AppError } from '../middlewares/error.middleware';
import { livreService } from '../services/livre.service';
import { CategorieLivre } from '@prisma/client';
import { livreUploadMiddleware, cleanupOnError } from '../middlewares/upload.middleware';
import { extractChaptersFromFile, detectFormat } from '../services/livre-extract.service';
import { log } from '../utils/logger';

const router = Router();

// GET /livres/stats - Statistiques (public)
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
    const stats = await livreService.getStats();
    res.json({ success: true, data: stats });
}));

// GET /livres - Liste paginée (public)
router.get('/', validate(queryLivreSchema, 'query'), asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, categorie, auteur, sort, order } = req.query as any;
    const result = await livreService.findAll({
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        categorie: categorie as CategorieLivre | undefined,
        auteur: auteur as string | undefined,
        sort: sort || 'createdAt',
        order: order || 'desc',
    });
    res.json({ success: true, ...result });
}));

// GET /livres/:id - Détails (public)
router.get('/:id', validateId(), asyncHandler(async (req: Request, res: Response) => {
    const livre = await livreService.findById(req.params.id);
    res.json({ success: true, data: livre });
}));

// POST /livres/upload - Upload fichier + créer livre (ADMIN/EDITOR)
router.post('/upload', authenticate, authorize('ADMIN', 'EDITOR'), livreUploadMiddleware.single('file'), asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
        throw new AppError(400, 'Aucun fichier fourni');
    }

    const { titre, auteur, categorie, editeur, anneePublication, isbn, resume } = req.body;

    if (!titre?.trim() || !auteur?.trim() || !categorie?.trim()) {
        cleanupOnError(req.file.path);
        throw new AppError(400, 'Titre, auteur et catégorie sont obligatoires');
    }

    // Validate categorie
    const validCategories = Object.values(CategorieLivre);
    if (!validCategories.includes(categorie as CategorieLivre)) {
        cleanupOnError(req.file.path);
        throw new AppError(400, `Catégorie invalide. Valeurs acceptées : ${validCategories.join(', ')}`);
    }

    try {
        const format = detectFormat(req.file.originalname);
        const { chapitres, metadata } = await extractChaptersFromFile(req.file.path, format);

        log.info('Livre file extracted', { format, chapitresCount: chapitres.length, originalName: req.file.originalname });

        const livre = await livreService.create({
            titre: titre.trim(),
            auteur: auteur.trim(),
            categorie: categorie as CategorieLivre,
            editeur: editeur?.trim() || undefined,
            anneePublication: anneePublication ? parseInt(anneePublication, 10) : undefined,
            isbn: isbn?.trim() || undefined,
            resume: resume?.trim() || undefined,
            fichierOriginal: req.file.path,
            formatOriginal: format,
            fichierPdf: format === 'pdf' ? req.file.path : undefined,
            chapitres,
        });

        res.status(201).json({ success: true, data: livre });
    } catch (error) {
        cleanupOnError(req.file.path);
        throw error;
    }
}));

// POST /livres - Créer (ADMIN/EDITOR)
router.post('/', authenticate, authorize('ADMIN', 'EDITOR'), validate(createLivreSchema, 'body'), asyncHandler(async (req: Request, res: Response) => {
    const livre = await livreService.create(req.body);
    res.status(201).json({ success: true, data: livre });
}));

// PUT /livres/:id - Modifier (ADMIN/EDITOR)
router.put('/:id', authenticate, authorize('ADMIN', 'EDITOR'), validateId(), validate(updateLivreSchema, 'body'), asyncHandler(async (req: Request, res: Response) => {
    const livre = await livreService.update(req.params.id, req.body);
    res.json({ success: true, data: livre });
}));

// DELETE /livres/:id - Supprimer (ADMIN)
router.delete('/:id', authenticate, authorize('ADMIN'), validateId(), asyncHandler(async (req: Request, res: Response) => {
    await livreService.delete(req.params.id);
    res.json({ success: true, message: 'Livre supprimé' });
}));

export default router;
