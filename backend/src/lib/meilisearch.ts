import { MeiliSearch, Index } from 'meilisearch';

const SEARCH_URL = process.env.SEARCH_URL || 'http://localhost:7700';
const MEILI_MASTER_KEY = process.env.MEILI_MASTER_KEY || '';

export const meiliClient = new MeiliSearch({
    host: SEARCH_URL,
    apiKey: MEILI_MASTER_KEY,
});

// Index pour les textes juridiques
export const TEXTES_INDEX_NAME = 'textes';

// Configuration de l'index des textes
export async function initMeiliSearch(): Promise<Index> {
    try {
        // Essayer de récupérer l'index existant, sinon le créer
        let index: Index;
        try {
            index = meiliClient.index(TEXTES_INDEX_NAME);
            await index.fetchInfo();
        } catch {
            // L'index n'existe pas, le créer
            const task = await meiliClient.createIndex(TEXTES_INDEX_NAME, {
                primaryKey: 'id',
            });
            await meiliClient.waitForTask(task.taskUid);
            index = meiliClient.index(TEXTES_INDEX_NAME);
        }

        // Configurer les attributs recherchables
        await index.updateSearchableAttributes([
            'titre',
            'titreComplet',
            'numero',
            'nor',
            'visas',
            'signataires',
            'articles', // Contenu des articles indexé
        ]);

        // Configurer les attributs filtrables
        await index.updateFilterableAttributes([
            'nature',
            'etat',
            'datePublication',
            'dateSignature',
        ]);

        // Configurer les attributs triables
        await index.updateSortableAttributes([
            'datePublication',
            'dateSignature',
            'createdAt',
        ]);

        // Configurer les attributs affichés
        await index.updateDisplayedAttributes([
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
        return index;
    } catch (error) {
        console.error('❌ Failed to initialize Meilisearch:', error);
        throw error;
    }
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

// Fonction pour supprimer un texte de l'index
export async function removeTexteFromIndex(texteId: string): Promise<void> {
    await meiliClient.index(TEXTES_INDEX_NAME).deleteDocument(texteId);
}

// Fonction de recherche
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

export default meiliClient;
