import { Router, Request, Response } from 'express';
import { searchTextes, searchArticles } from '../lib/meilisearch';

const router = Router();

// GET /recherche - Recherche full-text via Meilisearch (textes + articles)
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

        const searchOptions = {
            nature: nature as string | undefined,
            etat: etat as string | undefined,
            dateDebut: dateDebut as string | undefined,
            dateFin: dateFin as string | undefined,
        };

        // Search textes and articles in parallel
        const [textesResult, articlesResult] = await Promise.all([
            searchTextes(q as string, {
                ...searchOptions,
                limit: limitNum,
                offset,
            }),
            searchArticles(q as string, {
                ...searchOptions,
                limit: limitNum,
                offset,
            }),
        ]);

        // Tag results with their type
        const texteHits = textesResult.hits.map((hit: any) => ({
            ...hit,
            type: 'texte',
        }));

        const articleHits = articlesResult.hits.map((hit: any) => ({
            ...hit,
            type: 'article',
        }));

        // Merge: articles first (more specific), then textes
        const allHits = [...articleHits, ...texteHits];
        const totalEstimated = textesResult.estimatedTotalHits + articlesResult.estimatedTotalHits;

        res.json({
            query: q,
            hits: allHits,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalEstimated,
                totalPages: Math.ceil(totalEstimated / limitNum),
            },
            processingTimeMs: Math.max(textesResult.processingTimeMs, articlesResult.processingTimeMs),
        });
    } catch (error) {
        console.error('Error searching:', error);
        res.status(500).json({ error: 'Erreur lors de la recherche' });
    }
});

export default router;
