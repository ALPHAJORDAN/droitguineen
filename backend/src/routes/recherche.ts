import { Router, Request, Response } from 'express';
import { searchTextes, searchArticles, searchSuggestions } from '../lib/meilisearch';
import { asyncHandler } from '../middlewares/error.middleware';

const router = Router();

// GET /recherche/suggestions - Smart autocomplete suggestions
router.get('/suggestions', asyncHandler(async (req: Request, res: Response) => {
    const { q = '', limit = '6' } = req.query;
    const limitNum = Math.min(Math.max(1, parseInt(limit as string, 10) || 6), 10);

    const trimmedQ = (q as string).trim().slice(0, 500);
    if (!trimmedQ || trimmedQ.length < 2) {
        return res.json({ query: q, hits: [], processingTimeMs: 0 });
    }

    const result = await searchSuggestions(trimmedQ, limitNum);

    res.json({
        query: q,
        hits: result.hits,
        processingTimeMs: result.processingTimeMs,
    });
}));

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

    // Vérifier que la requête n'est pas vide et tronquer à 500 chars
    const trimmedQ = (q as string).trim().slice(0, 500);
    if (!trimmedQ) {
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

    const offset = (pageNum - 1) * limitNum;
    // Fetch slightly more than needed from each index for good merge quality
    const perIndexLimit = Math.min(limitNum, 15);

    const [textesResult, articlesResult] = await Promise.all([
        searchTextes(trimmedQ, {
            ...searchOptions,
            limit: perIndexLimit,
            offset,
        }),
        searchArticles(trimmedQ, {
            ...searchOptions,
            limit: perIndexLimit,
            offset,
        }),
    ]);

    // Tag results with their type
    type ScoredHit = Record<string, unknown> & { type: string; _rankingScore?: number };

    const texteHits: ScoredHit[] = (textesResult.hits as Record<string, unknown>[]).map((hit) => ({
        ...hit,
        type: 'texte',
    }));

    const articleHits: ScoredHit[] = (articlesResult.hits as Record<string, unknown>[]).map((hit) => ({
        ...hit,
        type: 'article',
    }));

    // Merge by ranking score (descending) for relevance-based ordering
    const allHits = [...texteHits, ...articleHits]
        .sort((a, b) => (b._rankingScore ?? 0) - (a._rankingScore ?? 0))
        .slice(0, limitNum);

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
