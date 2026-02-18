import { Router, Request, Response } from 'express';
import { searchTextes, searchArticles } from '../lib/meilisearch';
import { asyncHandler } from '../middlewares/error.middleware';

const router = Router();

// GET /recherche - Recherche full-text via Meilisearch (textes + articles)
router.get('/', asyncHandler(async (req: Request, res: Response) => {
    const {
        q = '',
        nature,
        etat,
        dateDebut,
        dateFin,
        page = '1',
        limit = '20',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(Math.max(1, parseInt(limit as string, 10) || 20), 100);

    // Vérifier que la requête n'est pas vide
    if (!q || (q as string).trim().length === 0) {
        return res.status(400).json({
            success: false,
            error: 'Le paramètre de recherche "q" est requis',
        });
    }

    const searchOptions = {
        nature: nature as string | undefined,
        etat: etat as string | undefined,
        dateDebut: dateDebut as string | undefined,
        dateFin: dateFin as string | undefined,
    };

    // Split the limit between textes and articles so merged results respect limitNum
    const articleLimit = Math.ceil(limitNum / 2);
    const texteLimit = limitNum - articleLimit;
    const offset = (pageNum - 1) * limitNum;
    const articleOffset = Math.floor(offset / 2);
    const texteOffset = offset - articleOffset;

    // Search textes and articles in parallel
    const [textesResult, articlesResult] = await Promise.all([
        searchTextes(q as string, {
            ...searchOptions,
            limit: texteLimit,
            offset: texteOffset,
        }),
        searchArticles(q as string, {
            ...searchOptions,
            limit: articleLimit,
            offset: articleOffset,
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

    // Merge: articles first (more specific), then textes — total respects limitNum
    const allHits = [...articleHits, ...texteHits].slice(0, limitNum);
    const totalEstimated = textesResult.estimatedTotalHits + articlesResult.estimatedTotalHits;

    res.json({
        query: q,
        hits: allHits,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total: totalEstimated,
            totalPages: Math.max(1, Math.ceil(totalEstimated / limitNum)),
        },
        processingTimeMs: Math.max(textesResult.processingTimeMs, articlesResult.processingTimeMs),
    });
}));

export default router;
