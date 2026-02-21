"use client";

import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { LivreCard } from "@/components/LivreCard";
import { Pagination } from "@/components/Pagination";
import { LoadingState, ErrorAlert, EmptyState } from "@/components/ui/StateDisplay";
import { useLivres } from "@/lib/hooks";
import { CATEGORIE_LIVRE_LABELS, Livre } from "@/lib/api";
import { BookOpen, Search, ArrowUpDown, X, Loader2 } from "lucide-react";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const ALL_CATEGORIES = Object.keys(CATEGORIE_LIVRE_LABELS);

const SORT_OPTIONS = [
    { value: "createdAt:desc", label: "Plus recents" },
    { value: "createdAt:asc", label: "Plus anciens" },
    { value: "titre:asc", label: "Titre A-Z" },
    { value: "titre:desc", label: "Titre Z-A" },
    { value: "anneePublication:desc", label: "Annee (recent)" },
    { value: "anneePublication:asc", label: "Annee (ancien)" },
];

const ITEMS_PER_PAGE = 20;

function useFilters() {
    const searchParams = useSearchParams();
    return {
        categorie: searchParams.get("categorie") || "",
        sort: searchParams.get("sort") || "createdAt",
        order: (searchParams.get("order") || "desc") as "asc" | "desc",
        page: parseInt(searchParams.get("page") || "1", 10),
    };
}

function BibliothequePageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const filters = useFilters();

    const { data, isLoading, isError, error } = useLivres({
        limit: ITEMS_PER_PAGE,
        categorie: filters.categorie || undefined,
        sort: filters.sort,
        order: filters.order,
        page: filters.page,
    });

    const livres = data?.data || [];
    const pagination = data?.pagination;
    const totalPages = pagination?.totalPages || 1;

    const updateFilter = (key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        params.delete("page");
        router.push(`/bibliotheque?${params.toString()}`);
    };

    const goToPage = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", page.toString());
        router.push(`/bibliotheque?${params.toString()}`);
    };

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const q = (formData.get("q") as string)?.trim();
        if (q) {
            router.push(`/recherche?q=${encodeURIComponent(q)}`);
        }
    };

    const handleSort = (value: string) => {
        const [sort, order] = value.split(":");
        const params = new URLSearchParams(searchParams.toString());
        params.set("sort", sort);
        params.set("order", order);
        params.delete("page");
        router.push(`/bibliotheque?${params.toString()}`);
    };

    const hasFilters = !!filters.categorie;

    const resetFilters = () => {
        router.push("/bibliotheque");
    };

    const start = (filters.page - 1) * ITEMS_PER_PAGE + 1;
    const end = Math.min(filters.page * ITEMS_PER_PAGE, pagination?.total || 0);

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main id="main-content" className="flex-1 container py-8 px-4 md:px-6">
                {/* Page header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold tracking-tight">Bibliotheque</h1>
                    <p className="text-muted-foreground mt-1">
                        Consultez des ouvrages de droit, philosophie, politique et economie.
                    </p>
                </div>

                {/* Toolbar: search + sort */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
                    <form onSubmit={handleSearch} className="relative flex-1 w-full sm:max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            name="q"
                            placeholder="Rechercher un livre..."
                            aria-label="Rechercher un livre"
                            className="w-full border rounded-lg pl-9 pr-4 py-2 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </form>
                    <div className="flex items-center gap-2">
                        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                        <select
                            value={`${filters.sort}:${filters.order}`}
                            onChange={(e) => handleSort(e.target.value)}
                            aria-label="Trier par"
                            className="border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                            {SORT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Category filter chips */}
                <div className="flex flex-wrap gap-2 mb-6">
                    <button
                        onClick={() => updateFilter("categorie", null)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            !filters.categorie ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-border"
                        }`}
                    >
                        Tous
                    </button>
                    {ALL_CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => updateFilter("categorie", filters.categorie === cat ? null : cat)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                filters.categorie === cat ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-border"
                            }`}
                        >
                            {CATEGORIE_LIVRE_LABELS[cat]}
                        </button>
                    ))}
                </div>

                {/* Active filters */}
                {hasFilters && (
                    <div className="flex items-center gap-3 mb-6">
                        <button
                            onClick={resetFilters}
                            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                        >
                            <X className="h-3 w-3" /> Effacer les filtres
                        </button>
                    </div>
                )}

                {/* Error State */}
                {isError && (
                    <div className="mb-6">
                        <ErrorAlert
                            message={error instanceof Error ? error.message : "Impossible de charger les livres. Verifiez que le serveur backend est demarre."}
                        />
                    </div>
                )}

                {/* Loading State */}
                {isLoading && <LoadingState message="Chargement des livres..." />}

                {/* Results info */}
                {!isLoading && !isError && pagination && (
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-muted-foreground">
                            {pagination.total} livre{pagination.total > 1 ? "s" : ""}
                            {pagination.total > ITEMS_PER_PAGE && (
                                <span> &middot; Affichage {start}-{end}</span>
                            )}
                        </p>
                    </div>
                )}

                {/* Livres List */}
                {!isLoading && !isError && (
                    <div className="space-y-3">
                        {livres.length === 0 ? (
                            <EmptyState
                                icon={<BookOpen className="h-12 w-12 opacity-50" />}
                                title="Aucun livre trouve"
                                description={hasFilters ? "Essayez de modifier vos filtres." : "Aucun livre disponible pour le moment."}
                            />
                        ) : (
                            livres.map((livre: Livre) => (
                                <LivreCard key={livre.id} livre={livre} />
                            ))
                        )}
                    </div>
                )}

                {/* Pagination */}
                {!isLoading && !isError && totalPages > 1 && (
                    <Pagination
                        currentPage={filters.page}
                        totalPages={totalPages}
                        onPageChange={goToPage}
                    />
                )}
            </main>
            <Footer />
        </div>
    );
}

export default function BibliothequePage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1 container py-8 px-4 md:px-6">
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                </main>
                <Footer />
            </div>
        }>
            <BibliothequePageContent />
        </Suspense>
    );
}
