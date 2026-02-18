import { MeiliSearch, Index } from 'meilisearch';
import prisma from './prisma';

const SEARCH_URL = process.env.SEARCH_URL || 'http://localhost:7700';
const MEILI_MASTER_KEY = process.env.MEILI_MASTER_KEY || '';

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

        await textesIndex.updateSearchableAttributes([
            'titre',
            'titreComplet',
            'numero',
            'nor',
            'visas',
            'signataires',
            'articles',
        ]);

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

        console.log('✅ Meilisearch index "textes" configured successfully');

        // === Index articles ===
        await initArticlesIndex();

        // Reindex articles if the index is empty
        await reindexAllArticlesIfEmpty();

        return textesIndex;
    } catch (error) {
        console.error('❌ Failed to initialize Meilisearch:', error);
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
        'numero',
    ]);

    await articlesIndex.updateFilterableAttributes([
        'texteId',
        'texteNature',
        'texteEtat',
        'texteDatePublication',
        'etat',
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

    console.log('✅ Meilisearch index "articles" configured successfully');
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
        filters.push(`nature = "${options.nature}"`);
    }
    if (options?.etat) {
        filters.push(`etat = "${options.etat}"`);
    }
    if (options?.dateDebut) {
        filters.push(`datePublication >= "${options.dateDebut}"`);
    }
    if (options?.dateFin) {
        filters.push(`datePublication <= "${options.dateFin}"`);
    }

    const result = await meiliClient.index(TEXTES_INDEX_NAME).search(query, {
        filter: filters.length > 0 ? filters.join(' AND ') : undefined,
        limit: options?.limit || 20,
        offset: options?.offset || 0,
        sort: ['datePublication:desc'],
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
        filters.push(`texteNature = "${options.nature}"`);
    }
    if (options?.etat) {
        filters.push(`texteEtat = "${options.etat}"`);
    }
    if (options?.dateDebut) {
        filters.push(`texteDatePublication >= "${options.dateDebut}"`);
    }
    if (options?.dateFin) {
        filters.push(`texteDatePublication <= "${options.dateFin}"`);
    }

    const result = await meiliClient.index(ARTICLES_INDEX_NAME).search(query, {
        filter: filters.length > 0 ? filters.join(' AND ') : undefined,
        limit: options?.limit || 10,
        offset: options?.offset || 0,
        attributesToHighlight: ['contenu'],
        highlightPreTag: '<mark>',
        highlightPostTag: '</mark>',
        attributesToCrop: ['contenu'],
        cropLength: 200,
    });

    return {
        hits: result.hits,
        estimatedTotalHits: result.estimatedTotalHits || 0,
        processingTimeMs: result.processingTimeMs,
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

        console.log('📝 Articles index is empty, reindexing existing articles...');

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

        console.log(`✅ Reindexed ${totalArticles} articles from ${textes.length} textes`);
    } catch (error) {
        console.warn('⚠️ Failed to reindex articles:', error);
    }
}

export default meiliClient;
