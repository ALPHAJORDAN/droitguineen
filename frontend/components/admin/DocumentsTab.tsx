"use client";

import { useState } from "react";
import { useFiles, useDeleteFile } from "@/lib/hooks";
import { FileData, NATURE_LABELS } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "./StatusBadge";
import { EditModal } from "./EditModal";
import { UploadModal } from "./UploadModal";
import { useToast } from "./Toast";
import Link from "next/link";
import {
    FileText, Trash2, RefreshCw, Loader2, Eye, Pencil, UploadCloud,
    Search, ChevronLeft, ChevronRight,
} from "lucide-react";

const ITEMS_PER_PAGE = 20;

export function DocumentsTab() {
    const { data: files = [], isLoading, refetch } = useFiles();
    const deleteFileMutation = useDeleteFile();
    const { addToast } = useToast();

    const [searchQuery, setSearchQuery] = useState("");
    const [filterNature, setFilterNature] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    // Filters
    const filtered = files.filter((file: FileData) => {
        if (searchQuery && !file.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (filterNature && file.type !== filterNature) return false;
        if (filterStatus && file.status !== filterStatus) return false;
        return true;
    });

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    // Get unique natures from files
    const natures = [...new Set(files.map((f: FileData) => f.type))].sort();

    const handleDelete = (id: string) => {
        if (pendingDeleteId === id) {
            deleteFileMutation.mutate(id, {
                onSuccess: () => {
                    addToast({ type: "success", message: "Document supprimé" });
                    setPendingDeleteId(null);
                },
                onError: (error) => {
                    addToast({ type: "error", message: error instanceof Error ? error.message : "Erreur" });
                    setPendingDeleteId(null);
                },
            });
        } else {
            setPendingDeleteId(id);
            setTimeout(() => setPendingDeleteId((prev) => (prev === id ? null : prev)), 3000);
        }
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
                    <div className="relative flex-1 sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Rechercher un document..."
                            className="w-full border rounded-lg pl-9 pr-4 py-2 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                        />
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
                <Button onClick={() => setIsUploadOpen(true)}>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Importer
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => { setFilterNature(null); setPage(1); }}
                    className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                        !filterNature ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"
                    }`}
                >
                    Tous ({files.length})
                </button>
                {natures.map((nature) => (
                    <button
                        key={nature}
                        onClick={() => { setFilterNature(filterNature === nature ? null : nature); setPage(1); }}
                        className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                            filterNature === nature ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"
                        }`}
                    >
                        {NATURE_LABELS[nature] || nature} ({files.filter((f: FileData) => f.type === nature).length})
                    </button>
                ))}
            </div>

            {/* Status filters */}
            <div className="flex gap-2">
                {["processed", "processing"].map((status) => (
                    <button
                        key={status}
                        onClick={() => { setFilterStatus(filterStatus === status ? null : status); setPage(1); }}
                        className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                            filterStatus === status ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"
                        }`}
                    >
                        {status === "processed" ? "Traités" : "En cours"}
                    </button>
                ))}
            </div>

            {/* File List */}
            <div className="bg-card border rounded-lg shadow-sm">
                <div className="p-4 border-b flex items-center justify-between">
                    <h2 className="font-semibold flex items-center">
                        <FileText className="mr-2 h-5 w-5 text-primary" />
                        Documents ({filtered.length})
                    </h2>
                </div>

                <div className="divide-y">
                    {isLoading ? (
                        <div className="p-8 text-center text-muted-foreground flex items-center justify-center">
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            Chargement...
                        </div>
                    ) : paginated.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>{searchQuery || filterNature ? "Aucun résultat" : "Aucun document"}</p>
                        </div>
                    ) : (
                        paginated.map((file: FileData) => (
                            <div key={file.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/50 transition-colors">
                                <div className="flex items-start space-x-4 flex-1 min-w-0">
                                    <div className="p-2 bg-primary/10 rounded flex-shrink-0">
                                        <FileText className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                        <Link href={`/lois/${file.id}`}>
                                            <h3 className="font-medium text-sm hover:text-primary transition-colors cursor-pointer truncate">
                                                {file.name}
                                            </h3>
                                        </Link>
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                                            <span className="px-1.5 py-0.5 bg-muted rounded text-xs">
                                                {NATURE_LABELS[file.type] || file.type}
                                            </span>
                                            <span>{file.uploadDate}</span>
                                            <StatusBadge status={file.status} />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <Link href={`/lois/${file.id}`}>
                                        <Button variant="ghost" size="sm">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                    <Button variant="ghost" size="sm" onClick={() => setEditingId(file.id)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant={pendingDeleteId === file.id ? "destructive" : "ghost"}
                                        size="sm"
                                        onClick={() => handleDelete(file.id)}
                                        disabled={deleteFileMutation.isPending}
                                    >
                                        {deleteFileMutation.isPending && pendingDeleteId === file.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : pendingDeleteId === file.id ? (
                                            <span className="text-xs">Confirmer ?</span>
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Page {page} sur {totalPages}
                        </p>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {isUploadOpen && <UploadModal onClose={() => setIsUploadOpen(false)} />}
            {editingId && <EditModal texteId={editingId} onClose={() => setEditingId(null)} />}
        </div>
    );
}
