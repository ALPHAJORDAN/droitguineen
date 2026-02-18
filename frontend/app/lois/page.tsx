"use client";

import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { Button } from "@/components/ui/Button";
import { useLois } from "@/lib/hooks";
import { NATURE_LABELS, ETAT_LABELS, Texte } from "@/lib/api";
import { formatDate, ETAT_STYLES } from "@/lib/utils";
import Link from "next/link";
import {
    Scale, FileText, BookOpen, Calendar, ArrowRight, AlertCircle, Loader2,
    Gavel, FileCheck, ScrollText, Search, ArrowUpDown, X,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from "lucide-react";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const NATURE_ICONS: Record<string, React.ReactNode> = {
    LOI: <Scale className="h-5 w-5" />,
    LOI_ORGANIQUE: <Scale className="h-5 w-5" />,
    LOI_CONSTITUTIONNELLE: <BookOpen className="h-5 w-5" />,
    ORDONNANCE: <Gavel className="h-5 w-5" />,
    DECRET: <FileCheck className="h-5 w-5" />,
    DECRET_LOI: <FileCheck className="h-5 w-5" />,
    ARRETE: <FileText className="h-5 w-5" />,
    CIRCULAIRE: <FileText className="h-5 w-5" />,
    DECISION: <FileText className="h-5 w-5" />,
    CONVENTION: <ScrollText className="h-5 w-5" />,
    TRAITE: <ScrollText className="h-5 w-5" />,
    CODE: <BookOpen className="h-5 w-5" />,
    JURISPRUDENCE: <Gavel className="h-5 w-5" />,
};

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
                            className="w-full border rounded-lg pl-9 pr-4 py-2 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </form>
                    <div className="flex items-center gap-2">
                        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                        <select
                            value={`${filters.sort}:${filters.order}`}
                            onChange={(e) => handleSort(e.target.value)}
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
                        <label className="text-xs text-muted-foreground">Du</label>
                        <input
                            type="date"
                            className="border rounded-lg px-2 py-1.5 text-xs bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            value={filters.dateDebut}
                            onChange={(e) => updateFilter("dateDebut", e.target.value || null)}
                        />
                        <label className="text-xs text-muted-foreground">au</label>
                        <input
                            type="date"
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
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6 flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        <p className="text-destructive">
                            {error instanceof Error ? error.message : "Impossible de charger les textes. Verifiez que le serveur backend est demarre."}
                        </p>
                    </div>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2 text-muted-foreground">Chargement des textes...</span>
                    </div>
                )}

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
                            <div className="text-center py-12 text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium">Aucun texte trouve</p>
                                <p className="text-sm mt-1">
                                    {hasFilters ? "Essayez de modifier vos filtres." : "Aucun texte disponible pour le moment."}
                                </p>
                            </div>
                        ) : (
                            textes.map((texte: Texte) => (
                                <Link
                                    key={texte.id}
                                    href={`/lois/${texte.id}`}
                                    className="group border rounded-lg p-5 hover:border-primary hover:shadow-md transition-all bg-card block"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-primary/10 rounded-lg text-primary flex-shrink-0">
                                            {NATURE_ICONS[texte.nature] || <FileText className="h-5 w-5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className="text-xs font-medium px-2 py-0.5 bg-muted rounded">
                                                    {NATURE_LABELS[texte.nature] || texte.nature}
                                                </span>
                                                {texte.etat && ETAT_LABELS[texte.etat] && (
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${ETAT_STYLES[texte.etat] || ETAT_STYLES.VIGUEUR}`}>
                                                        {ETAT_LABELS[texte.etat]}
                                                    </span>
                                                )}
                                                {texte.sousCategorie && (
                                                    <span className="text-xs font-medium px-2 py-0.5 bg-muted/60 rounded">
                                                        {texte.sousCategorie}
                                                    </span>
                                                )}
                                                {texte.datePublication && (
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {formatDate(texte.datePublication)}
                                                    </span>
                                                )}
                                            </div>
                                            <h2 className="text-base font-semibold group-hover:text-primary transition-colors line-clamp-2">
                                                {texte.titre}
                                            </h2>
                                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                                {texte.numero && <span>N&deg; {texte.numero}</span>}
                                                {texte.signataires && (
                                                    <span className="truncate max-w-xs">{texte.signataires}</span>
                                                )}
                                            </div>
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                )}

                {/* Pagination */}
                {!isLoading && !isError && totalPages > 1 && (
                    <div className="flex items-center justify-between pt-6 mt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                            Page {filters.page} sur {totalPages}
                        </p>
                        <div className="flex gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={filters.page <= 1}
                                onClick={() => goToPage(1)}
                                title="Premiere page"
                            >
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={filters.page <= 1}
                                onClick={() => goToPage(filters.page - 1)}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                <span className="hidden sm:inline ml-1">Precedent</span>
                            </Button>
                            <Button variant="ghost" size="sm" className="bg-primary/10 text-primary">
                                {filters.page}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={filters.page >= totalPages}
                                onClick={() => goToPage(filters.page + 1)}
                            >
                                <span className="hidden sm:inline mr-1">Suivant</span>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={filters.page >= totalPages}
                                onClick={() => goToPage(totalPages)}
                                title="Derniere page"
                            >
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
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
