"use client";

import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { Button } from "@/components/ui/Button";
import { TexteCard } from "@/components/TexteCard";
import { Pagination } from "@/components/Pagination";
import { LoadingState, ErrorAlert, EmptyState } from "@/components/ui/StateDisplay";
import { useLois } from "@/lib/hooks";
import { NATURE_LABELS, ETAT_LABELS, Texte } from "@/lib/api";
import Link from "next/link";
import { FileText, Search, ArrowUpDown, X, Loader2 } from "lucide-react";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const ALL_NATURES = [
    "LOI_CONSTITUTIONNELLE", "LOI", "LOI_ORGANIQUE", "ORDONNANCE",
    "DECRET", "DECRET_LOI", "ARRETE", "CIRCULAIRE", "DECISION",
    "CODE", "JURISPRUDENCE", "TRAITE", "CONVENTION",
];

const SORT_OPTIONS = [
    { value: "datePublication:desc", label: "Plus recents" },
    { value: "datePublication:asc", label: "Plus anciens" },
    { value: "titre:asc", label: "Titre A-Z" },
    { value: "titre:desc", label: "Titre Z-A" },
];

const ITEMS_PER_PAGE = 20;

function useFilters() {
    const searchParams = useSearchParams();
    return {
        nature: searchParams.get("nature") || "",
        etat: searchParams.get("etat") || "",
        dateDebut: searchParams.get("dateDebut") || "",
        dateFin: searchParams.get("dateFin") || "",
        sort: searchParams.get("sort") || "datePublication",
        order: (searchParams.get("order") || "desc") as "asc" | "desc",
        page: parseInt(searchParams.get("page") || "1", 10),
    };
}

function LoisPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const filters = useFilters();

    const { data, isLoading, isError, error } = useLois({
        limit: ITEMS_PER_PAGE,
        nature: filters.nature || undefined,
        etat: filters.etat || undefined,
        sort: filters.sort,
        order: filters.order,
        dateDebut: filters.dateDebut || undefined,
        dateFin: filters.dateFin || undefined,
        page: filters.page,
    });

    const textes = data?.data || [];
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
        router.push(`/lois?${params.toString()}`);
    };

    const goToPage = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", page.toString());
        router.push(`/lois?${params.toString()}`);
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
        router.push(`/lois?${params.toString()}`);
    };

    const hasFilters = filters.nature || filters.etat || filters.dateDebut || filters.dateFin;

    const resetFilters = () => {
        router.push("/lois");
    };

    const start = (filters.page - 1) * ITEMS_PER_PAGE + 1;
    const end = Math.min(filters.page * ITEMS_PER_PAGE, pagination?.total || 0);

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 container py-8 px-4 md:px-6">
                {/* Page header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold tracking-tight">Textes juridiques</h1>
                    <p className="text-muted-foreground mt-1">
                        Consultez l&apos;ensemble des textes legislatifs et reglementaires de la Republique de Guinee.
                    </p>
                </div>

                {/* Toolbar: search + sort */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
                    <form onSubmit={handleSearch} className="relative flex-1 w-full sm:max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            name="q"
                            placeholder="Rechercher un texte..."
                            aria-label="Rechercher un texte"
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

                {/* Nature filter chips */}
                <div className="flex flex-wrap gap-2 mb-4">
                    <button
                        onClick={() => updateFilter("nature", null)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            !filters.nature ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-border"
                        }`}
                    >
                        Tous
                    </button>
                    {ALL_NATURES.map((nature) => (
                        <button
                            key={nature}
                            onClick={() => updateFilter("nature", filters.nature === nature ? null : nature)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                filters.nature === nature ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-border"
                            }`}
                        >
                            {NATURE_LABELS[nature] || nature}
                        </button>
                    ))}
                </div>

                {/* Etat filter chips */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {Object.entries(ETAT_LABELS).map(([value, label]) => (
                        <button
                            key={value}
                            onClick={() => updateFilter("etat", filters.etat === value ? null : value)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                filters.etat === value ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-border"
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Date range + active filters */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <div className="flex items-center gap-2">
                        <label htmlFor="filter-date-debut" className="text-xs text-muted-foreground">Du</label>
                        <input
                            id="filter-date-debut"
                            type="date"
                            aria-label="Date de debut"
                            max={filters.dateFin || undefined}
                            className="border rounded-lg px-2 py-1.5 text-xs bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            value={filters.dateDebut}
                            onChange={(e) => updateFilter("dateDebut", e.target.value || null)}
                        />
                        <label htmlFor="filter-date-fin" className="text-xs text-muted-foreground">au</label>
                        <input
                            id="filter-date-fin"
                            type="date"
                            aria-label="Date de fin"
                            min={filters.dateDebut || undefined}
                            className="border rounded-lg px-2 py-1.5 text-xs bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            value={filters.dateFin}
                            onChange={(e) => updateFilter("dateFin", e.target.value || null)}
                        />
                    </div>
                    {hasFilters && (
                        <button
                            onClick={resetFilters}
                            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                        >
                            <X className="h-3 w-3" /> Effacer les filtres
                        </button>
                    )}
                </div>

                {/* Error State */}
                {isError && (
                    <div className="mb-6">
                        <ErrorAlert
                            message={error instanceof Error ? error.message : "Impossible de charger les textes. Verifiez que le serveur backend est demarre."}
                        />
                    </div>
                )}

                {/* Loading State */}
                {isLoading && <LoadingState message="Chargement des textes..." />}

                {/* Results info */}
                {!isLoading && !isError && pagination && (
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-muted-foreground">
                            {pagination.total} resultat{pagination.total > 1 ? "s" : ""}
                            {pagination.total > ITEMS_PER_PAGE && (
                                <span> &middot; Affichage {start}-{end}</span>
                            )}
                        </p>
                    </div>
                )}

                {/* Textes List */}
                {!isLoading && !isError && (
                    <div className="space-y-3">
                        {textes.length === 0 ? (
                            <EmptyState
                                icon={<FileText className="h-12 w-12 opacity-50" />}
                                title="Aucun texte trouve"
                                description={hasFilters ? "Essayez de modifier vos filtres." : "Aucun texte disponible pour le moment."}
                            />
                        ) : (
                            textes.map((texte: Texte) => (
                                <TexteCard key={texte.id} texte={texte} />
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

export default function LoisPage() {
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
            <LoisPageContent />
        </Suspense>
    );
}
