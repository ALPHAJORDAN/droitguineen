import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    fetchLois,
    getLoi,
    searchTextes,
    searchSuggestions,
    getFiles,
    deleteFile,
    uploadPdf,
    uploadPdfPreview,
    confirmUpload,
    updateLoi,
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    getRelations,
    createRelation,
    deleteRelation,
    detectRelations,
    getRelationGraph,
    downloadExport,
    loginApi,
    logoutApi,
    clearTokens,
    Texte,
    PaginatedResponse,
    SearchResponse,
    FileData,
    UploadPreviewResponse,
    UploadMetadata,
    AdminUser,
    PaginatedUsers,
    RelationsResponse,
    TexteRelation,
    RelationGraph,
} from "./api";

// ============ Query Keys ============
export const queryKeys = {
    lois: {
        all: ["lois"] as const,
        list: (filters?: object) => [...queryKeys.lois.all, "list", filters] as const,
        detail: (id: string) => [...queryKeys.lois.all, "detail", id] as const,
    },
    search: {
        all: ["search"] as const,
        results: (query: string, filters?: object) =>
            [...queryKeys.search.all, query, filters] as const,
    },
    files: {
        all: ["files"] as const,
        list: () => [...queryKeys.files.all, "list"] as const,
    },
    users: {
        all: ["users"] as const,
        list: (page?: number) => [...queryKeys.users.all, "list", page] as const,
    },
    suggestions: {
        all: ["suggestions"] as const,
        query: (q: string) => ["suggestions", q] as const,
    },
    relations: {
        all: ["relations"] as const,
        forTexte: (texteId: string) => [...queryKeys.relations.all, texteId] as const,
        graph: (texteId: string, depth?: number) => [...queryKeys.relations.all, "graph", texteId, depth] as const,
    },
};

// ============ Hooks pour les Lois/Textes ============

export function useLois(options?: {
    page?: number;
    limit?: number;
    nature?: string;
    sousCategorie?: string;
    etat?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    dateDebut?: string;
    dateFin?: string;
}) {
    return useQuery<PaginatedResponse<Texte>>({
        queryKey: queryKeys.lois.list(options),
        queryFn: () => fetchLois(options),
    });
}

export function useLoi(id: string, initialData?: Texte) {
    return useQuery<Texte>({
        queryKey: queryKeys.lois.detail(id),
        queryFn: () => getLoi(id),
        enabled: !!id,
        initialData,
    });
}

// ============ Hooks pour la Recherche ============

export function useSearch(
    query: string,
    options?: {
        nature?: string;
        etat?: string;
        dateDebut?: string;
        dateFin?: string;
        page?: number;
        limit?: number;
    }
) {
    return useQuery<SearchResponse>({
        queryKey: queryKeys.search.results(query, options),
        queryFn: () => searchTextes(query, options),
        enabled: query.length > 0,
    });
}

export function useSuggestions(query: string) {
    return useQuery<SearchResponse>({
        queryKey: queryKeys.suggestions.query(query),
        queryFn: () => searchSuggestions(query),
        enabled: query.trim().length >= 2,
        staleTime: 30_000,
        gcTime: 60_000,
        placeholderData: (prev) => prev,
    });
}

// ============ Hooks pour les Fichiers (Admin) ============

export function useFiles() {
    return useQuery<FileData[]>({
        queryKey: queryKeys.files.list(),
        queryFn: getFiles,
    });
}

export function useDeleteFile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteFile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.files.all });
        },
    });
}

export function useUploadPdf() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            file,
            metadata,
        }: {
            file: File;
            metadata: UploadMetadata;
        }) => uploadPdf(file, metadata),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.files.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.lois.all });
        },
    });
}

export function useUploadPdfPreview() {
    return useMutation({
        mutationFn: ({
            file,
            metadata,
        }: {
            file: File;
            metadata: UploadMetadata;
        }) => uploadPdfPreview(file, metadata),
    });
}

export function useConfirmUpload() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: confirmUpload,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.files.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.lois.all });
        },
    });
}

export function useUpdateLoi() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateLoi>[1] }) =>
            updateLoi(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.lois.detail(id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.lois.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.files.all });
        },
    });
}

// ============ Hooks pour les Utilisateurs (Admin) ============

export function useUsers(page = 1, limit = 20) {
    return useQuery<PaginatedUsers>({
        queryKey: queryKeys.users.list(page),
        queryFn: () => getUsers(page, limit),
    });
}

export function useCreateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
        },
    });
}

export function useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateUser>[1] }) =>
            updateUser(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
        },
    });
}

export function useDeleteUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
        },
    });
}

// ============ Hooks pour les Relations ============

export function useRelations(texteId: string) {
    return useQuery<RelationsResponse>({
        queryKey: queryKeys.relations.forTexte(texteId),
        queryFn: () => getRelations(texteId),
        enabled: !!texteId,
    });
}

export function useRelationGraph(texteId: string, depth?: number) {
    return useQuery<RelationGraph>({
        queryKey: queryKeys.relations.graph(texteId, depth),
        queryFn: () => getRelationGraph(texteId, depth),
        enabled: !!texteId,
    });
}

export function useCreateRelation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createRelation,
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.relations.forTexte(data.texteSourceId)
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.relations.forTexte(data.texteCibleId)
            });
            queryClient.invalidateQueries({ queryKey: queryKeys.lois.all });
        },
    });
}

export function useDeleteRelation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteRelation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.relations.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.lois.all });
        },
    });
}

export function useDetectRelations() {
    return useMutation({
        mutationFn: detectRelations,
    });
}

// ============ Hooks Auth ============

export function useLogin() {
    return useMutation({
        mutationFn: ({ email, password }: { email: string; password: string }) =>
            loginApi(email, password),
    });
}

export function useLogout() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: logoutApi,
        onSettled: () => {
            clearTokens();
            queryClient.clear();
        },
    });
}

// ============ Hooks pour les Exports ============

export function useExport() {
    return useMutation({
        mutationFn: ({ texteId, format }: { texteId: string; format: 'pdf' | 'docx' | 'json' | 'html' }) =>
            downloadExport(texteId, format),
    });
}
