import { Router, Request, Response } from 'express';
import { searchTextes } from '../lib/meilisearch';

const router = Router();

// GET /recherche - Recherche full-text via Meilisearch
router.get('/', async (req: Request, res: Response) => {
    try {
        const {
            q = '',
            nature,
            etat,
            dateDebut,
            dateFin,
            page = '1',
            limit = '20',
        } = req.query;

        const pageNum = parseInt(page as string, 10);
        const limitNum = Math.min(parseInt(limit as string, 10), 100);
        const offset = (pageNum - 1) * limitNum;

        // Vérifier que la requête n'est pas vide
        if (!q || (q as string).trim().length === 0) {
            return res.status(400).json({
                error: 'Le paramètre de recherche "q" est requis',
            });
        }

        const result = await searchTextes(q as string, {
            nature: nature as string | undefined,
            etat: etat as string | undefined,
            dateDebut: dateDebut as string | undefined,
            dateFin: dateFin as string | undefined,
            limit: limitNum,
            offset,
        });

        res.json({
            query: q,
            hits: result.hits,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: result.estimatedTotalHits,
                totalPages: Math.ceil(result.estimatedTotalHits / limitNum),
            },
            processingTimeMs: result.processingTimeMs,
        });
    } catch (error) {
        console.error('Error searching:', error);
        res.status(500).json({ error: 'Erreur lors de la recherche' });
    }
});

export default router;
