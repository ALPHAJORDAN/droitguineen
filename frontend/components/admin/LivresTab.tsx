"use client";

import { useState } from "react";
import { useLivres, useDeleteLivre, useCreateLivre } from "@/lib/hooks";
import { Livre, CATEGORIE_LIVRE_LABELS } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { useToast } from "./Toast";
import Link from "next/link";
import {
    BookOpen, Trash2, RefreshCw, Loader2, Eye, Plus,
    Search, ChevronLeft, ChevronRight, X,
} from "lucide-react";

const ITEMS_PER_PAGE = 20;
const ALL_CATEGORIES = Object.keys(CATEGORIE_LIVRE_LABELS);

export function LivresTab() {
    const [page, setPage] = useState(1);
    const [filterCategorie, setFilterCategorie] = useState<string | undefined>(undefined);

    const { data, isLoading, refetch } = useLivres({
        page,
        limit: ITEMS_PER_PAGE,
        categorie: filterCategorie,
    });
    const deleteMutation = useDeleteLivre();
    const createMutation = useCreateLivre();
    const { addToast } = useToast();

    const livres = data?.data || [];
    const pagination = data?.pagination;
    const totalPages = pagination?.totalPages || 1;

    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);

    const handleDelete = (id: string) => {
        if (pendingDeleteId === id) {
            deleteMutation.mutate(id, {
                onSuccess: () => {
                    addToast({ type: "success", message: "Livre supprime" });
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
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
                <Button onClick={() => setShowCreateForm(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un livre
                </Button>
            </div>

            {/* Category filters */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => { setFilterCategorie(undefined); setPage(1); }}
                    className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                        !filterCategorie ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"
                    }`}
                >
                    Tous
                </button>
                {ALL_CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => { setFilterCategorie(filterCategorie === cat ? undefined : cat); setPage(1); }}
                        className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                            filterCategorie === cat ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"
                        }`}
                    >
                        {CATEGORIE_LIVRE_LABELS[cat]}
                    </button>
                ))}
            </div>

            {/* Livres List */}
            <div className="bg-card border rounded-lg shadow-sm">
                <div className="p-4 border-b flex items-center justify-between">
                    <h2 className="font-semibold flex items-center">
                        <BookOpen className="mr-2 h-5 w-5 text-primary" />
                        Livres {pagination ? `(${pagination.total})` : ""}
                    </h2>
                </div>

                <div className="divide-y">
                    {isLoading ? (
                        <div className="p-8 text-center text-muted-foreground flex items-center justify-center">
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            Chargement...
                        </div>
                    ) : livres.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Aucun livre</p>
                        </div>
                    ) : (
                        livres.map((livre: Livre) => (
                            <div key={livre.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/50 transition-colors">
                                <div className="flex items-start space-x-4 flex-1 min-w-0">
                                    <div className="p-2 bg-primary/10 rounded flex-shrink-0">
                                        <BookOpen className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                        <Link href={`/bibliotheque/${livre.id}`}>
                                            <h3 className="font-medium text-sm hover:text-primary transition-colors cursor-pointer truncate">
                                                {livre.titre}
                                            </h3>
                                        </Link>
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                                            <span className="px-1.5 py-0.5 bg-muted rounded text-xs">
                                                {CATEGORIE_LIVRE_LABELS[livre.categorie] || livre.categorie}
                                            </span>
                                            <span>{livre.auteur}</span>
                                            {livre.anneePublication && <span>{livre.anneePublication}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <Link href={`/bibliotheque/${livre.id}`}>
                                        <Button variant="ghost" size="sm">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                    <Button
                                        variant={pendingDeleteId === livre.id ? "destructive" : "ghost"}
                                        size="sm"
                                        onClick={() => handleDelete(livre.id)}
                                        disabled={deleteMutation.isPending}
                                    >
                                        {deleteMutation.isPending && pendingDeleteId === livre.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : pendingDeleteId === livre.id ? (
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

            {/* Create Form Modal */}
            {showCreateForm && (
                <CreateLivreModal
                    onClose={() => setShowCreateForm(false)}
                    onCreate={(data) => {
                        createMutation.mutate(data, {
                            onSuccess: () => {
                                addToast({ type: "success", message: "Livre cree" });
                                setShowCreateForm(false);
                            },
                            onError: (error) => {
                                addToast({ type: "error", message: error instanceof Error ? error.message : "Erreur" });
                            },
                        });
                    }}
                    isPending={createMutation.isPending}
                />
            )}
        </div>
    );
}

function CreateLivreModal({
    onClose,
    onCreate,
    isPending,
}: {
    onClose: () => void;
    onCreate: (data: { titre: string; auteur: string; categorie: string; editeur?: string; anneePublication?: number; isbn?: string; resume?: string }) => void;
    isPending: boolean;
}) {
    const [titre, setTitre] = useState("");
    const [auteur, setAuteur] = useState("");
    const [categorie, setCategorie] = useState("DROIT");
    const [editeur, setEditeur] = useState("");
    const [anneePublication, setAnneePublication] = useState("");
    const [isbn, setIsbn] = useState("");
    const [resume, setResume] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!titre.trim() || !auteur.trim()) return;
        onCreate({
            titre: titre.trim(),
            auteur: auteur.trim(),
            categorie,
            editeur: editeur.trim() || undefined,
            anneePublication: anneePublication ? parseInt(anneePublication, 10) : undefined,
            isbn: isbn.trim() || undefined,
            resume: resume.trim() || undefined,
        });
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-background border rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">Ajouter un livre</h2>
                    <button onClick={onClose} className="p-1 hover:bg-muted rounded">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Titre *</label>
                        <input
                            type="text"
                            required
                            value={titre}
                            onChange={(e) => setTitre(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Auteur *</label>
                        <input
                            type="text"
                            required
                            value={auteur}
                            onChange={(e) => setAuteur(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Categorie *</label>
                        <select
                            value={categorie}
                            onChange={(e) => setCategorie(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                            {ALL_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{CATEGORIE_LIVRE_LABELS[cat]}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Editeur</label>
                            <input
                                type="text"
                                value={editeur}
                                onChange={(e) => setEditeur(e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Annee</label>
                            <input
                                type="number"
                                value={anneePublication}
                                onChange={(e) => setAnneePublication(e.target.value)}
                                placeholder="2024"
                                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">ISBN</label>
                        <input
                            type="text"
                            value={isbn}
                            onChange={(e) => setIsbn(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Resume</label>
                        <textarea
                            value={resume}
                            onChange={(e) => setResume(e.target.value)}
                            rows={4}
                            className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
                        <Button type="submit" disabled={isPending || !titre.trim() || !auteur.trim()}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Creer
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
