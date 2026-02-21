const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ============ Auth Types ============

export interface User {
    id: string;
    email: string;
    nom: string;
    prenom: string;
    role: 'ADMIN' | 'EDITOR' | 'USER';
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}

// ============ Auth Token Management ============

const TOKEN_KEY = 'leguinee_access_token';
const REFRESH_KEY = 'leguinee_refresh_token';

export function getStoredAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
}

export function getStoredRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_KEY);
}

export function storeTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
}

// ============ Auth-aware Fetch ============

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function tryRefreshToken(): Promise<string | null> {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) return null;

    try {
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) {
            clearTokens();
            return null;
        }
        const data = await res.json();
        const newToken = data.data.accessToken;
        localStorage.setItem(TOKEN_KEY, newToken);
        return newToken;
    } catch {
        clearTokens();
        return null;
    }
}

/**
 * Fetch with JWT Authorization header + auto-refresh on 401.
 */
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = getStoredAccessToken();
    const headers = new Headers(options.headers);
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    let res = await fetch(url, { ...options, headers });

    // On 401, try to refresh the token once
    if (res.status === 401 && getStoredRefreshToken()) {
        if (!isRefreshing) {
            isRefreshing = true;
            refreshPromise = tryRefreshToken().finally(() => {
                isRefreshing = false;
            });
        }

        const newToken = await refreshPromise;
        if (newToken) {
            headers.set('Authorization', `Bearer ${newToken}`);
            res = await fetch(url, { ...options, headers });
        }
    }

    return res;
}

// ============ Auth API Functions ============

export async function loginApi(email: string, password: string): Promise<LoginResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Échec de la connexion');
    }
    const response = await res.json();
    return response.data;
}

export async function logoutApi(): Promise<void> {
    try {
        await authFetch(`${API_BASE_URL}/auth/logout`, { method: 'POST' });
    } finally {
        clearTokens();
    }
}

export async function getMeApi(): Promise<User> {
    const res = await authFetch(`${API_BASE_URL}/auth/me`);
    if (!res.ok) throw new Error('Non authentifié');
    const response = await res.json();
    return response.data;
}

// ============ Domain Types ============

export interface Texte {
    id: string;
    cid: string;
    nor?: string;
    eli?: string;
    titre: string;
    titreComplet?: string;
    nature: string;
    sousCategorie?: string;
    numero?: string;
    dateSignature?: string;
    datePublication?: string;
    dateEntreeVigueur?: string;
    etat: string;
    visas?: string;
    signataires?: string;
    sourceJO?: string;
    urlJO?: string;
    fichierPdf?: string;
    articles?: Article[];
    sections?: Section[];
    createdAt: string;
    updatedAt: string;
}

export interface Article {
    id: string;
    cid: string;
    numero: string;
    contenu: string;
    etat: string;
    ordre: number;
    section?: Section;
}

export interface Section {
    id: string;
    cid: string;
    titre: string;
    niveau: number;
    ordre: number;
    enfants?: Section[];
    articles?: Article[];
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface ArticleHit {
    type: 'article';
    id: string;
    numero: string;
    contenu: string;
    ordre: number;
    etat: string;
    texteId: string;
    texteTitre: string;
    texteNature: string;
    texteNumero: string | null;
    texteEtat: string;
    texteDatePublication: string | null;
    _formatted?: {
        contenu?: string;
        numero?: string;
    };
    _cropLength?: number;
}

export type SearchHit = (Texte & { type: 'texte' }) | ArticleHit;

export interface SearchResponse {
    query: string;
    hits: SearchHit[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    processingTimeMs: number;
}

// ============ Public API Functions (no auth needed) ============

export async function fetchLois(options?: {
    page?: number;
    limit?: number;
    nature?: string;
    sousCategorie?: string;
    etat?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    dateDebut?: string;
    dateFin?: string;
}): Promise<PaginatedResponse<Texte>> {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', options.page.toString());
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.nature) params.set('nature', options.nature);
    if (options?.sousCategorie) params.set('sousCategorie', options.sousCategorie);
    if (options?.etat) params.set('etat', options.etat);
    if (options?.sort) params.set('sort', options.sort);
    if (options?.order) params.set('order', options.order);
    if (options?.dateDebut) params.set('dateDebut', options.dateDebut);
    if (options?.dateFin) params.set('dateFin', options.dateFin);

    const res = await fetch(`${API_BASE_URL}/lois?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch lois');
    const response = await res.json();
    return {
        data: response.data,
        pagination: response.pagination,
    };
}

export async function getLoi(id: string): Promise<Texte> {
    const res = await fetch(`${API_BASE_URL}/lois/${id}`);
    if (!res.ok) throw new Error('Failed to fetch loi');
    const response = await res.json();
    return response.data;
}
export interface StatsResponse {
    total: number;
    enVigueur: number;
    natureCounts: Record<string, number>;
    recent: Texte[];
}

export async function fetchStats(): Promise<StatsResponse> {
    const res = await fetch(`${API_BASE_URL}/lois/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    const response = await res.json();
    return response.data;
}

export async function searchTextes(query: string, options?: {
    nature?: string;
    etat?: string;
    dateDebut?: string;
    dateFin?: string;
    page?: number;
    limit?: number;
}): Promise<SearchResponse> {
    const params = new URLSearchParams({ q: query });
    if (options?.nature) params.set('nature', options.nature);
    if (options?.etat) params.set('etat', options.etat);
    if (options?.dateDebut) params.set('dateDebut', options.dateDebut);
    if (options?.dateFin) params.set('dateFin', options.dateFin);
    if (options?.page) params.set('page', options.page.toString());
    if (options?.limit) params.set('limit', options.limit.toString());

    const res = await fetch(`${API_BASE_URL}/recherche?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to search');
    return res.json();
}

export async function searchSuggestions(query: string): Promise<SearchResponse> {
    const params = new URLSearchParams({ q: query, limit: '6' });
    const res = await fetch(`${API_BASE_URL}/recherche/suggestions?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch suggestions');
    return res.json();
}

// ============ Protected API Functions (auth required) ============

export async function createLoi(data: {
    cid: string;
    titre: string;
    nature: string;
    nor?: string;
    numero?: string;
    dateSignature?: string;
    datePublication?: string;
    visas?: string;
    signataires?: string;
    sourceJO?: string;
    articles?: { cid?: string; numero: string; contenu: string; ordre?: number }[];
}): Promise<Texte> {
    const res = await authFetch(`${API_BASE_URL}/lois`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create loi');
    const response = await res.json();
    return response.data;
}

// --- Fichiers (Admin) ---

export interface FileData {
    id: string;
    name: string;
    type: string;
    size: string;
    uploadDate: string;
    status: "processed" | "processing" | "error";
}

export async function getFiles(): Promise<FileData[]> {
    const res = await authFetch(`${API_BASE_URL}/upload/files`, {
        cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch files');
    const response = await res.json();
    return response.data || [];
}

export async function deleteFile(id: string): Promise<void> {
    const res = await authFetch(`${API_BASE_URL}/upload/files/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete file');
}

// ============ Upload Preview/Confirm Types ============

export interface UploadPreviewResponse {
    filePath: string;
    extractionMethod: 'native' | 'ocr';
    metadata: {
        titre?: string;
        nature?: string;
        numero?: string;
        dateSignature?: string;
    };
    textPreview: string;
    articles: Array<{ numero: string; contenu: string }>;
    sections: unknown[];
    isCode: boolean;
    articlesCount: number;
    fullTextLength: number;
}

export interface UploadMetadata {
    titre?: string;
    nature?: string;
    sousCategorie?: string;
    numero?: string;
    dateSignature?: string;
    datePublication?: string;
    sourceJO?: string;
}

/**
 * Upload PDF for preview (no DB save). Returns extracted data for review.
 */
export async function uploadPdfPreview(
    file: File,
    metadata: UploadMetadata
): Promise<UploadPreviewResponse> {
    const formData = new FormData();
    formData.append('file', file);
    // createInDb is NOT set → defaults to false → preview mode
    if (metadata.titre) formData.append('titre', metadata.titre);
    if (metadata.nature) formData.append('nature', metadata.nature);
    if (metadata.sousCategorie) formData.append('sousCategorie', metadata.sousCategorie);
    if (metadata.numero) formData.append('numero', metadata.numero);
    if (metadata.dateSignature) formData.append('dateSignature', metadata.dateSignature);
    if (metadata.datePublication) formData.append('datePublication', metadata.datePublication);
    if (metadata.sourceJO) formData.append('sourceJO', metadata.sourceJO);

    const res = await authFetch(`${API_BASE_URL}/upload/pdf`, {
        method: 'POST',
        body: formData,
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Échec de l\'analyse du PDF');
    }
    const response = await res.json();
    return response;
}

/**
 * Confirm a previewed upload and save to database.
 */
export async function confirmUpload(data: {
    filePath: string;
    cid: string;
    titre: string;
    nature: string;
    sousCategorie?: string;
    numero?: string;
    dateSignature?: string;
    datePublication?: string;
    sourceJO?: string;
    articles?: Array<{ numero: string; contenu: string }>;
    sections?: unknown[];
}): Promise<Texte> {
    const res = await authFetch(`${API_BASE_URL}/upload/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Échec de l\'enregistrement');
    }
    const response = await res.json();
    return response.data;
}

/**
 * Upload PDF and save directly to DB (skips preview).
 */
export async function uploadPdf(
    file: File,
    metadata: UploadMetadata
): Promise<Texte> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('createInDb', 'true');
    if (metadata.titre) formData.append('titre', metadata.titre);
    if (metadata.nature) formData.append('nature', metadata.nature);
    if (metadata.sousCategorie) formData.append('sousCategorie', metadata.sousCategorie);
    if (metadata.numero) formData.append('numero', metadata.numero);
    if (metadata.dateSignature) formData.append('dateSignature', metadata.dateSignature);
    if (metadata.datePublication) formData.append('datePublication', metadata.datePublication);
    if (metadata.sourceJO) formData.append('sourceJO', metadata.sourceJO);

    const res = await authFetch(`${API_BASE_URL}/upload/pdf`, {
        method: 'POST',
        body: formData,
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload PDF');
    }
    const response = await res.json();
    return response.data;
}

/**
 * Update an existing texte.
 */
export async function updateLoi(id: string, data: Partial<{
    titre: string;
    titreComplet: string;
    nature: string;
    sousCategorie: string;
    numero: string;
    etat: string;
    nor: string;
    eli: string;
    dateSignature: string;
    datePublication: string;
    dateEntreeVigueur: string;
    signataires: string;
    visas: string;
    sourceJO: string;
    urlJO: string;
}>): Promise<Texte> {
    const res = await authFetch(`${API_BASE_URL}/lois/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Échec de la mise à jour');
    }
    const response = await res.json();
    return response.data;
}

// ============ User Management Types ============

export interface AdminUser {
    id: string;
    email: string;
    nom: string;
    prenom: string;
    role: 'ADMIN' | 'EDITOR' | 'USER';
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface PaginatedUsers {
    data: AdminUser[];
    total: number;
    page: number;
    limit: number;
}

// ============ User Management API ============

export async function getUsers(page = 1, limit = 20): Promise<PaginatedUsers> {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    const res = await authFetch(`${API_BASE_URL}/auth/users?${params.toString()}`);
    if (!res.ok) throw new Error('Échec du chargement des utilisateurs');
    const response = await res.json();
    return {
        data: response.data || [],
        total: response.total || 0,
        page: response.page || page,
        limit: response.limit || limit,
    };
}

export async function createUser(data: {
    email: string;
    password: string;
    nom: string;
    prenom: string;
    role?: string;
}): Promise<AdminUser> {
    const res = await authFetch(`${API_BASE_URL}/auth/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Échec de la création');
    }
    const response = await res.json();
    return response.data;
}

export async function updateUser(id: string, data: {
    nom?: string;
    prenom?: string;
    role?: string;
    isActive?: boolean;
}): Promise<AdminUser> {
    const res = await authFetch(`${API_BASE_URL}/auth/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Échec de la mise à jour');
    }
    const response = await res.json();
    return response.data;
}

export async function deleteUser(id: string): Promise<void> {
    const res = await authFetch(`${API_BASE_URL}/auth/users/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Échec de la suppression');
    }
}

// Nature labels for display
export const NATURE_LABELS: Record<string, string> = {
    LOI: "Loi",
    LOI_ORGANIQUE: "Loi organique",
    LOI_CONSTITUTIONNELLE: "Constitution",
    ORDONNANCE: "Ordonnance",
    DECRET: "Décret",
    DECRET_LOI: "Décret-loi",
    ARRETE: "Arrêté",
    CIRCULAIRE: "Circulaire",
    DECISION: "Décision",
    CONVENTION: "Convention",
    TRAITE: "Traité",
    CODE: "Code",
    JURISPRUDENCE: "Jurisprudence",
    AUTRE: "Autre",
    // OHADA
    ACTE_UNIFORME_OHADA: "Acte Uniforme OHADA",
    JURISPRUDENCE_CCJA: "Jurisprudence CCJA",
    TRAITE_OHADA: "Traité OHADA",
    REGLEMENT_OHADA: "Règlement OHADA",
};

// Etat labels for display
export const ETAT_LABELS: Record<string, string> = {
    VIGUEUR: "En vigueur",
    VIGUEUR_DIFF: "En vigueur différée",
    MODIFIE: "Modifié",
    ABROGE: "Abrogé",
    ABROGE_DIFF: "Abrogé différé",
    PERIME: "Périmé",
};

// Type relation labels
export const TYPE_RELATION_LABELS: Record<string, string> = {
    ABROGE: "Abroge",
    ABROGE_PARTIELLEMENT: "Abroge partiellement",
    MODIFIE: "Modifie",
    COMPLETE: "Complète",
    CITE: "Cite",
    APPLIQUE: "Applique",
    PROROGE: "Proroge",
    SUSPEND: "Suspend",
    RATIFIE: "Ratifie",
    CODIFIE: "Codifie",
    CONSOLIDE: "Consolide",
};

// ============ Relations Types ============

export interface TexteRelation {
    id: string;
    type: string;
    texteSourceId: string;
    texteCibleId: string;
    articleCibleNum?: string;
    articleSourceNum?: string;
    description?: string;
    dateEffet?: string;
    createdAt: string;
    texteSource?: Partial<Texte>;
    texteCible?: Partial<Texte>;
}

export interface RelationsResponse {
    texte: { id: string; titre: string };
    relations: {
        abroge: TexteRelation[];
        modifie: TexteRelation[];
        complete: TexteRelation[];
        cite: TexteRelation[];
        applique: TexteRelation[];
        proroge: TexteRelation[];
        suspend: TexteRelation[];
        ratifie: TexteRelation[];
        codifie: TexteRelation[];
        abrogePar: TexteRelation[];
        modifiePar: TexteRelation[];
        completePar: TexteRelation[];
        citePar: TexteRelation[];
        appliquePar: TexteRelation[];
        prorogePar: TexteRelation[];
        suspendPar: TexteRelation[];
        ratifiePar: TexteRelation[];
        codifiePar: TexteRelation[];
    };
    counts: {
        source: number;
        cible: number;
        total: number;
    };
}

export interface RelationGraphNode {
    id: string;
    titre: string;
    nature: string;
    etat: string;
}

export interface RelationGraphEdge {
    source: string;
    target: string;
    type: string;
    label: string;
}

export interface RelationGraph {
    nodes: RelationGraphNode[];
    edges: RelationGraphEdge[];
    rootId: string;
}

// ============ Relations API (read=public, write=protected) ============

export async function getRelations(texteId: string): Promise<RelationsResponse> {
    const res = await fetch(`${API_BASE_URL}/relations/${texteId}`);
    if (!res.ok) throw new Error('Failed to fetch relations');
    return res.json();
}

export async function createRelation(data: {
    texteSourceId: string;
    texteCibleId: string;
    type: string;
    articleCibleNum?: string;
    articleSourceNum?: string;
    description?: string;
    dateEffet?: string;
}): Promise<TexteRelation> {
    const res = await authFetch(`${API_BASE_URL}/relations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create relation');
    return res.json();
}

export async function deleteRelation(id: string): Promise<void> {
    const res = await authFetch(`${API_BASE_URL}/relations/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete relation');
}

export async function detectRelations(texteId: string): Promise<{
    texteId: string;
    detected: Array<{
        type: string;
        reference: string;
        context: string;
        texteCibleId?: string;
    }>;
    count: number;
    matchedCount: number;
}> {
    const res = await authFetch(`${API_BASE_URL}/relations/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texteId }),
    });
    if (!res.ok) throw new Error('Failed to detect relations');
    return res.json();
}

export async function getRelationGraph(texteId: string, depth?: number): Promise<RelationGraph> {
    const params = new URLSearchParams();
    if (depth) params.set('depth', depth.toString());

    const res = await fetch(`${API_BASE_URL}/relations/graph/${texteId}?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch relation graph');
    return res.json();
}

// ============ Export Functions (public) ============

export function getExportPdfUrl(texteId: string): string {
    return `${API_BASE_URL}/export/pdf/${texteId}`;
}

export function getExportDocxUrl(texteId: string): string {
    return `${API_BASE_URL}/export/docx/${texteId}`;
}

export function getExportJsonUrl(texteId: string): string {
    return `${API_BASE_URL}/export/json/${texteId}`;
}

export function getExportHtmlUrl(texteId: string): string {
    return `${API_BASE_URL}/export/html/${texteId}`;
}

let activeExportController: AbortController | null = null;

export async function downloadExport(
    texteId: string,
    format: 'pdf' | 'docx' | 'json' | 'html'
): Promise<void> {
    // Abort any previous export in progress
    activeExportController?.abort();
    const controller = new AbortController();
    activeExportController = controller;

    const urls: Record<string, string> = {
        pdf: getExportPdfUrl(texteId),
        docx: getExportDocxUrl(texteId),
        json: getExportJsonUrl(texteId),
        html: getExportHtmlUrl(texteId),
    };

    const res = await fetch(urls[format], { signal: controller.signal });
    if (!res.ok) throw new Error(`Failed to export as ${format.toUpperCase()}`);

    const blob = await res.blob();
    const contentDisposition = res.headers.get('content-disposition');
    let filename = `document.${format}`;

    if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    try {
        document.body.appendChild(a);
        a.click();
    } finally {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        activeExportController = null;
    }
}

// ============ Bibliothèque (Livres) ============

export interface Livre {
    id: string;
    titre: string;
    auteur: string;
    editeur?: string;
    anneePublication?: number;
    isbn?: string;
    resume?: string;
    categorie: string;
    couverture?: string;
    fichierPdf?: string;
    fichierOriginal?: string;
    formatOriginal?: string;
    chapitres?: Chapitre[];
    createdAt: string;
    updatedAt: string;
}

export interface Chapitre {
    id: string;
    titre: string;
    contenu: string;
    ordre: number;
}

export const CATEGORIE_LIVRE_LABELS: Record<string, string> = {
    DROIT: "Droit",
    PHILOSOPHIE: "Philosophie",
    POLITIQUE: "Politique",
    ECONOMIE: "Économie",
};

export async function fetchLivres(options?: {
    page?: number;
    limit?: number;
    categorie?: string;
    auteur?: string;
    sort?: string;
    order?: 'asc' | 'desc';
}): Promise<PaginatedResponse<Livre>> {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', options.page.toString());
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.categorie) params.set('categorie', options.categorie);
    if (options?.auteur) params.set('auteur', options.auteur);
    if (options?.sort) params.set('sort', options.sort);
    if (options?.order) params.set('order', options.order);

    const res = await fetch(`${API_BASE_URL}/livres?${params.toString()}`);
    if (!res.ok) throw new Error('Erreur lors du chargement des livres');
    return res.json();
}

export async function getLivre(id: string): Promise<Livre> {
    const res = await fetch(`${API_BASE_URL}/livres/${id}`);
    if (!res.ok) throw new Error('Livre non trouvé');
    const json = await res.json();
    return json.data;
}

export async function fetchLivreStats(): Promise<{ total: number; categorieCounts: Record<string, number>; recent: Livre[] }> {
    const res = await fetch(`${API_BASE_URL}/livres/stats`);
    if (!res.ok) throw new Error('Erreur lors du chargement des statistiques');
    const json = await res.json();
    return json.data;
}

export async function createLivre(data: Partial<Livre> & { chapitres?: Array<{ titre: string; contenu: string; ordre: number }> }): Promise<Livre> {
    const res = await authFetch(`${API_BASE_URL}/livres`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors de la création');
    }
    const json = await res.json();
    return json.data;
}

export async function updateLivre(id: string, data: Partial<Livre>): Promise<Livre> {
    const res = await authFetch(`${API_BASE_URL}/livres/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors de la mise à jour');
    }
    const json = await res.json();
    return json.data;
}

export async function deleteLivre(id: string): Promise<void> {
    const res = await authFetch(`${API_BASE_URL}/livres/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors de la suppression');
    }
}

export function getLivreExportPdfUrl(livreId: string): string {
    return `${API_BASE_URL}/export/livre/pdf/${livreId}`;
}

export function getLivreDownloadUrl(livreId: string): string {
    return `${API_BASE_URL}/export/livre/download/${livreId}`;
}

export async function uploadLivre(file: File, metadata: {
    titre: string;
    auteur: string;
    categorie: string;
    editeur?: string;
    anneePublication?: number;
    isbn?: string;
    resume?: string;
}): Promise<Livre> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('titre', metadata.titre);
    formData.append('auteur', metadata.auteur);
    formData.append('categorie', metadata.categorie);
    if (metadata.editeur) formData.append('editeur', metadata.editeur);
    if (metadata.anneePublication) formData.append('anneePublication', metadata.anneePublication.toString());
    if (metadata.isbn) formData.append('isbn', metadata.isbn);
    if (metadata.resume) formData.append('resume', metadata.resume);

    const res = await authFetch(`${API_BASE_URL}/livres/upload`, {
        method: 'POST',
        body: formData,
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors de l\'upload du livre');
    }
    const json = await res.json();
    return json.data;
}

export const FORMAT_LABELS: Record<string, string> = {
    pdf: 'PDF',
    epub: 'EPUB',
    txt: 'TXT',
    html: 'HTML',
};
