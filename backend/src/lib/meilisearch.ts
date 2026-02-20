import { MeiliSearch, Index } from 'meilisearch';
import prisma from './prisma';
import { log } from '../utils/logger';

const SEARCH_URL = process.env.SEARCH_URL || 'http://localhost:7700';
const MEILI_MASTER_KEY = process.env.MEILI_MASTER_KEY || '';

// French stop words to ignore in search queries for better precision
const FRENCH_STOP_WORDS = [
    'au', 'aux', 'de', 'des', 'du', 'en', 'et', 'la', 'le', 'les',
    'un', 'une', 'par', 'pour', 'sur', 'dans', 'avec', 'est', 'sont',
    'ce', 'cette', 'ces', 'ou', 'qui', 'que', 'dont', 'il', 'elle',
    'se', 'sa', 'son', 'ses', 'ne', 'pas', 'plus',
    'article', 'articles', // noise in legal texts - "article" appears in nearly every document
];

export const meiliClient = new MeiliSearch({
    host: SEARCH_URL,
    apiKey: MEILI_MASTER_KEY,
});

// Index pour les textes juridiques
export const TEXTES_INDEX_NAME = 'textes';
export const ARTICLES_INDEX_NAME = 'articles';

// Configuration de l'index des textes
export async function initMeiliSearch(): Promise<Index> {
    try {
        // === Index textes ===
        let textesIndex: Index;
        try {
            textesIndex = meiliClient.index(TEXTES_INDEX_NAME);
            await textesIndex.fetchInfo();
        } catch {
            const task = await meiliClient.createIndex(TEXTES_INDEX_NAME, {
                primaryKey: 'id',
            });
            await meiliClient.waitForTask(task.taskUid);
            textesIndex = meiliClient.index(TEXTES_INDEX_NAME);
        }

        // Searchable attributes ordered by relevance (most important first)
        // Removed 'articles' - article content is searched via the dedicated articles index
        await textesIndex.updateSearchableAttributes([
            'titre',
            'titreComplet',
            'numero',
            'nor',
            'visas',
            'signataires',
        ]);

        // Ranking rules: prioritize exact matches and attribute order
        await textesIndex.updateRankingRules([
            'words',
            'typo',
            'proximity',
            'attribute',
            'sort',
            'exactness',
        ]);

        // Stricter typo tolerance for legal precision
        await textesIndex.updateTypoTolerance({
            enabled: true,
            minWordSizeForTypos: {
                oneTypo: 5,    // Only allow 1 typo for words >= 5 chars
                twoTypos: 9,   // Only allow 2 typos for words >= 9 chars
            },
        });

        // French stop words so "du", "de", "la" etc. don't pollute ranking
        await textesIndex.updateStopWords(FRENCH_STOP_WORDS);

        await textesIndex.updateFilterableAttributes([
            'nature',
            'etat',
            'datePublication',
            'dateSignature',
        ]);

        await textesIndex.updateSortableAttributes([
            'datePublication',
            'dateSignature',
            'createdAt',
        ]);

        await textesIndex.updateDisplayedAttributes([
            'id',
            'cid',
            'nor',
            'eli',
            'titre',
            'titreComplet',
            'nature',
            'numero',
            'dateSignature',
            'datePublication',
            'etat',
            'sourceJO',
        ]);

        log.info('Meilisearch index "textes" configured successfully');

        // === Index articles ===
        await initArticlesIndex();

        // Reindex articles if the index is empty
        await reindexAllArticlesIfEmpty();

        return textesIndex;
    } catch (error) {
        log.error('Failed to initialize Meilisearch', error as Error);
        throw error;
    }
}

// Initialize the articles index
async function initArticlesIndex(): Promise<Index> {
    let articlesIndex: Index;
    try {
        articlesIndex = meiliClient.index(ARTICLES_INDEX_NAME);
        await articlesIndex.fetchInfo();
    } catch {
        const task = await meiliClient.createIndex(ARTICLES_INDEX_NAME, {
            primaryKey: 'id',
        });
        await meiliClient.waitForTask(task.taskUid);
        articlesIndex = meiliClient.index(ARTICLES_INDEX_NAME);
    }

    await articlesIndex.updateSearchableAttributes([
        'contenu',
        'texteTitre',
        'numero',
    ]);

    // Ranking rules for articles
    await articlesIndex.updateRankingRules([
        'words',
        'typo',
        'proximity',
        'attribute',
        'sort',
        'exactness',
    ]);

    // Stricter typo tolerance
    await articlesIndex.updateTypoTolerance({
        enabled: true,
        minWordSizeForTypos: {
            oneTypo: 5,
            twoTypos: 9,
        },
    });

    // French stop words
    await articlesIndex.updateStopWords(FRENCH_STOP_WORDS);

    await articlesIndex.updateFilterableAttributes([
        'texteId',
        'texteNature',
        'texteEtat',
        'texteDatePublication',
        'etat',
        'numero',
    ]);

    await articlesIndex.updateSortableAttributes([
        'ordre',
        'texteDatePublication',
    ]);

    await articlesIndex.updateDisplayedAttributes([
        'id',
        'numero',
        'contenu',
        'ordre',
        'etat',
        'texteId',
        'texteTitre',
        'texteNature',
        'texteNumero',
        'texteEtat',
        'texteDatePublication',
    ]);

    log.info('Meilisearch index "articles" configured successfully');
    return articlesIndex;
}

// Fonction pour indexer un texte
export async function indexTexte(texte: {
    id: string;
    cid: string;
    nor?: string | null;
    eli?: string | null;
    titre: string;
    titreComplet?: string | null;
    nature: string;
    numero?: string | null;
    dateSignature?: Date | null;
    datePublication?: Date | null;
    etat: string;
    visas?: string | null;
    signataires?: string | null;
    sourceJO?: string | null;
    articles?: { contenu: string }[];
}): Promise<void> {
    const document = {
        ...texte,
        dateSignature: texte.dateSignature?.toISOString(),
        datePublication: texte.datePublication?.toISOString(),
        articles: texte.articles?.map(a => a.contenu).join(' ') || '',
    };

    await meiliClient.index(TEXTES_INDEX_NAME).addDocuments([document]);
}

// Index articles individually for article-level search
export async function indexArticles(texte: {
    id: string;
    titre: string;
    nature: string;
    numero?: string | null;
    etat: string;
    datePublication?: Date | null;
    articles?: { id: string; numero: string; contenu: string; ordre: number; etat: string }[];
}): Promise<void> {
    if (!texte.articles || texte.articles.length === 0) return;

    const documents = texte.articles.map(article => ({
        id: article.id,
        numero: article.numero,
        contenu: article.contenu,
        ordre: article.ordre,
        etat: article.etat,
        texteId: texte.id,
        texteTitre: texte.titre,
        texteNature: texte.nature,
        texteNumero: texte.numero || null,
        texteEtat: texte.etat,
        texteDatePublication: texte.datePublication?.toISOString() || null,
    }));

    await meiliClient.index(ARTICLES_INDEX_NAME).addDocuments(documents);
}

// Fonction pour supprimer un texte de l'index
export async function removeTexteFromIndex(texteId: string): Promise<void> {
    await meiliClient.index(TEXTES_INDEX_NAME).deleteDocument(texteId);
}

// Remove all articles belonging to a texte
export async function removeArticlesFromIndex(texteId: string): Promise<void> {
    // Meilisearch supports delete by filter
    await meiliClient.index(ARTICLES_INDEX_NAME).deleteDocuments({
        filter: `texteId = "${texteId}"`,
    });
}

/** Escape a value for use in Meilisearch filter strings */
function sanitizeFilterValue(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

// Fonction de recherche dans les textes
export async function searchTextes(
    query: string,
    options?: {
        nature?: string;
        etat?: string;
        dateDebut?: string;
        dateFin?: string;
        limit?: number;
        offset?: number;
    }
): Promise<{
    hits: unknown[];
    estimatedTotalHits: number;
    processingTimeMs: number;
}> {
    const filters: string[] = [];

    if (options?.nature) {
        filters.push(`nature = "${sanitizeFilterValue(options.nature)}"`);
    }
    if (options?.etat) {
        filters.push(`etat = "${sanitizeFilterValue(options.etat)}"`);
    }
    if (options?.dateDebut) {
        filters.push(`datePublication >= "${sanitizeFilterValue(options.dateDebut)}"`);
    }
    if (options?.dateFin) {
        filters.push(`datePublication <= "${sanitizeFilterValue(options.dateFin)}"`);
    }

    const result = await meiliClient.index(TEXTES_INDEX_NAME).search(query, {
        filter: filters.length > 0 ? filters.join(' AND ') : undefined,
        limit: options?.limit ?? 20,
        offset: options?.offset ?? 0,
        // No sort - let Meilisearch rank by relevance (much faster)
        matchingStrategy: 'last',
        showRankingScore: true,
    });

    return {
        hits: result.hits,
        estimatedTotalHits: result.estimatedTotalHits || 0,
        processingTimeMs: result.processingTimeMs,
    };
}

// Search in articles index with highlighting
export async function searchArticles(
    query: string,
    options?: {
        nature?: string;
        etat?: string;
        dateDebut?: string;
        dateFin?: string;
        limit?: number;
        offset?: number;
    }
): Promise<{
    hits: unknown[];
    estimatedTotalHits: number;
    processingTimeMs: number;
}> {
    const filters: string[] = [];

    if (options?.nature) {
        filters.push(`texteNature = "${sanitizeFilterValue(options.nature)}"`);
    }
    if (options?.etat) {
        filters.push(`texteEtat = "${sanitizeFilterValue(options.etat)}"`);
    }
    if (options?.dateDebut) {
        filters.push(`texteDatePublication >= "${sanitizeFilterValue(options.dateDebut)}"`);
    }
    if (options?.dateFin) {
        filters.push(`texteDatePublication <= "${sanitizeFilterValue(options.dateFin)}"`);
    }

    const result = await meiliClient.index(ARTICLES_INDEX_NAME).search(query, {
        filter: filters.length > 0 ? filters.join(' AND ') : undefined,
        limit: options?.limit ?? 10,
        offset: options?.offset ?? 0,
        attributesToHighlight: ['contenu'],
        highlightPreTag: '<mark>',
        highlightPostTag: '</mark>',
        attributesToCrop: ['contenu'],
        cropLength: 200,
        matchingStrategy: 'last',
        showRankingScore: true,
    });

    return {
        hits: result.hits,
        estimatedTotalHits: result.estimatedTotalHits || 0,
        processingTimeMs: result.processingTimeMs,
    };
}

// Smart suggestion search: detects article number patterns for targeted results
export async function searchSuggestions(
    query: string,
    limit: number = 6,
): Promise<{
    hits: unknown[];
    processingTimeMs: number;
}> {
    const trimmed = query.trim();

    // Detect patterns like "article 45 du code civil", "art. 12 code pénal", "article premier"
    const articlePattern = /^(?:art(?:icle)?\.?\s+)(\d+|premier|1er)\s*(?:du|de\s+la|de\s+l'|de|des|d')?\s*(.*)$/i;
    const match = trimmed.match(articlePattern);

    if (match) {
        // User is searching for a specific article of a specific text
        const articleNum = match[1].toLowerCase() === 'premier' ? '1er'
            : match[1].toLowerCase() === '1er' ? '1er'
            : match[1];
        const textQuery = match[2]?.trim() || '';

        // Search articles with numero filter + text name query
        const articleFilter = `numero = "${sanitizeFilterValue(articleNum)}"`;

        const [targeted, fallback] = await Promise.all([
            // Targeted: exact article number + text name search
            meiliClient.index(ARTICLES_INDEX_NAME).search(textQuery || trimmed, {
                filter: articleFilter,
                limit: limit,
                attributesToHighlight: ['contenu'],
                highlightPreTag: '<mark>',
                highlightPostTag: '</mark>',
                attributesToCrop: ['contenu'],
                cropLength: 150,
                matchingStrategy: 'last',
                showRankingScore: true,
            }),
            // Fallback: also search textes by text name (e.g., "code civil")
            textQuery
                ? meiliClient.index(TEXTES_INDEX_NAME).search(textQuery, {
                    limit: 3,
                    matchingStrategy: 'last',
                    showRankingScore: true,
                })
                : Promise.resolve({ hits: [], processingTimeMs: 0 }),
        ]);

        const articleHits = targeted.hits.map((hit: any) => ({
            ...hit,
            type: 'article',
            _rankingScore: (hit._rankingScore ?? 0) + 0.1, // Boost targeted articles
        }));

        const texteHits = (fallback as any).hits.map((hit: any) => ({
            ...hit,
            type: 'texte',
        }));

        const allHits = [...articleHits, ...texteHits]
            .sort((a: any, b: any) => (b._rankingScore ?? 0) - (a._rankingScore ?? 0))
            .slice(0, limit);

        return {
            hits: allHits,
            processingTimeMs: Math.max(targeted.processingTimeMs, (fallback as any).processingTimeMs || 0),
        };
    }

    // Detect bare number pattern: "45", "12" → likely searching for an article
    const bareNumberPattern = /^(\d+)$/;
    const bareMatch = trimmed.match(bareNumberPattern);

    if (bareMatch) {
        const articleNum = bareMatch[1];
        const articleFilter = `numero = "${sanitizeFilterValue(articleNum)}"`;

        const result = await meiliClient.index(ARTICLES_INDEX_NAME).search('', {
            filter: articleFilter,
            limit: limit,
            attributesToHighlight: ['contenu'],
            highlightPreTag: '<mark>',
            highlightPostTag: '</mark>',
            attributesToCrop: ['contenu'],
            cropLength: 150,
            showRankingScore: true,
        });

        return {
            hits: result.hits.map((hit: any) => ({ ...hit, type: 'article' })),
            processingTimeMs: result.processingTimeMs,
        };
    }

    // No article pattern detected → standard dual-index search
    const [textesResult, articlesResult] = await Promise.all([
        searchTextes(query, { limit: Math.ceil(limit / 2) }),
        searchArticles(query, { limit: Math.ceil(limit / 2) }),
    ]);

    const texteHits = textesResult.hits.map((hit: any) => ({ ...hit, type: 'texte' }));
    const articleHits = articlesResult.hits.map((hit: any) => ({ ...hit, type: 'article' }));

    const allHits = [...texteHits, ...articleHits]
        .sort((a: any, b: any) => (b._rankingScore ?? 0) - (a._rankingScore ?? 0))
        .slice(0, limit);

    return {
        hits: allHits,
        processingTimeMs: Math.max(textesResult.processingTimeMs, articlesResult.processingTimeMs),
    };
}

// Reindex all existing articles if the articles index is empty
async function reindexAllArticlesIfEmpty(): Promise<void> {
    try {
        // Check if the articles index has any documents
        const stats = await meiliClient.index(ARTICLES_INDEX_NAME).getStats();
        if (stats.numberOfDocuments > 0) {
            return; // Already has documents
        }

        log.info('Articles index is empty, reindexing existing articles...');

        const textes = await prisma.texte.findMany({
            include: {
                articles: {
                    select: { id: true, numero: true, contenu: true, ordre: true, etat: true },
                },
            },
        });

        let totalArticles = 0;
        for (const texte of textes) {
            if (texte.articles.length > 0) {
                await indexArticles(texte);
                totalArticles += texte.articles.length;
            }
        }

        log.info('Reindexed articles', { totalArticles, totalTextes: textes.length });
    } catch (error) {
        log.warn('Failed to reindex articles', { err: error });
    }
}

export default meiliClient;
