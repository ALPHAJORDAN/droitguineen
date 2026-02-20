import { Router, Request, Response } from 'express';
import { loisController } from '../controllers/lois.controller';
import { validate, validateId } from '../middlewares/validation.middleware';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { createLoiSchema, updateLoiSchema, paginationSchema } from '../validators/loi.validator';
import { asyncHandler } from '../middlewares/error.middleware';
import { texteRepository } from '../repositories/texte.repository';

const router = Router();

// GET /lois/stats - Statistiques agrégées (public, 1 requête au lieu de 13)
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
    const stats = await texteRepository.getStats();
    res.json({ success: true, data: stats });
}));

// GET /lois - Liste paginée des textes (public)
router.get('/', validate(paginationSchema, 'query'), loisController.getAll);

// GET /lois/:id - Détails d'un texte (public)
router.get('/:id', validateId(), loisController.getById);

// POST /lois - Créer un nouveau texte (ADMIN, EDITOR)
router.post('/', authenticate, authorize('ADMIN', 'EDITOR'), validate(createLoiSchema, 'body'), loisController.create);

// PUT /lois/:id - Mettre à jour un texte (ADMIN, EDITOR)
router.put('/:id', authenticate, authorize('ADMIN', 'EDITOR'), validateId(), validate(updateLoiSchema, 'body'), loisController.update);

// DELETE /lois/:id - Supprimer un texte (ADMIN)
router.delete('/:id', authenticate, authorize('ADMIN'), validateId(), loisController.delete);

export default router;
