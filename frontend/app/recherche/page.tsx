"use client";

import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { SearchBar } from "@/components/ui/SearchBar";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import {
    FileText, Filter, Loader2, AlertCircle, Calendar, ArrowRight,
    Scale, BookOpen, Gavel, FileCheck, ScrollText, X,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    ArrowUpDown, SlidersHorizontal,
} from "lucide-react";
import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSearch, useLois } from "@/lib/hooks";
import { NATURE_LABELS, ETAT_LABELS, Texte, ArticleHit, SearchHit } from "@/lib/api";
import { formatDate, ETAT_STYLES } from "@/lib/utils";

// Map frontend type filters to backend nature values
const TYPE_TO_NATURE: Record<string, string> = {
    "Constitution": "LOI_CONSTITUTIONNELLE",
    "Lois": "LOI",
    "Lois organiques": "LOI_ORGANIQUE",
    "Ordonnances": "ORDONNANCE",
    "Decrets": "DECRET",
    "Decrets-lois": "DECRET_LOI",
    "Arretes": "ARRETE",
    "Circulaires": "CIRCULAIRE",
    "Decisions": "DECISION",
    "Conventions": "CONVENTION",
    "Traites": "TRAITE",
    "Codes": "CODE",
    "Jurisprudence": "JURISPRUDENCE",
};

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

// Filter categories for the sidebar
const FILTER_GROUPS = [
    {
        label: "Textes legislatifs",
        types: ["Constitution", "Lois", "Lois organiques", "Ordonnances"],
    },
    {
        label: "Textes reglementaires",
        types: ["Decrets", "Arretes", "Circulaires", "Decisions"],
    },
    {
        label: "Autres",
        types: ["Codes", "Jurisprudence", "Traites", "Conventions"],
    },
];

const SORT_OPTIONS = [
    { value: "datePublication:desc", label: "Plus recents" },
    { value: "datePublication:asc", label: "Plus anciens" },
    { value: "titre:asc", label: "Titre A-Z" },
    { value: "titre:desc", label: "Titre Z-A" },
];

function useSearchFilters() {
    const searchParams = useSearchParams();
    return {
        query: searchParams.get("q") || searchParams.get("query") || "",
        type: searchParams.get("type"),
        etat: searchParams.get("etat"),
        dateDebut: searchParams.get("dateDebut"),
        dateFin: searchParams.get("dateFin"),
        sort: searchParams.get("sort") || "datePublication",
        order: (searchParams.get("order") || "desc") as "asc" | "desc",
        page: parseInt(searchParams.get("page") || "1", 10),
    };
}

function TexteCard({ texte }: { texte: Texte }) {
    return (
        <Link
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
                    <h3 className="text-base font-semibold group-hover:text-primary transition-colors line-clamp-2">
                        {texte.titre}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        {texte.numero && (
                            <span>N&deg; {texte.numero}</span>
                        )}
                        {texte.signataires && (
                            <span className="truncate max-w-xs">{texte.signataires}</span>
                        )}
                    </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
            </div>
        </Link>
    );
}

/** Strip all HTML tags except <mark> to prevent XSS from Meilisearch content */
function sanitizeHighlight(html: string): string {
    return html.replace(/<\/?(?!mark\b)[^>]+>/gi, '');
}

function ArticleCard({ article }: { article: ArticleHit }) {
    const highlightedContent = article._formatted?.contenu || article.contenu;
    // Truncate plain content for display (highlighted content is already cropped by Meilisearch)
    const displayContent = article._formatted?.contenu
        ? sanitizeHighlight(highlightedContent)
        : (article.contenu.length > 300 ? article.contenu.slice(0, 300) + "..." : article.contenu);

    return (
        <Link
            href={`/lois/${article.texteId}`}
            className="group border rounded-lg p-5 hover:border-primary hover:shadow-md transition-all bg-card block border-l-4 border-l-blue-400 dark:border-l-blue-500"
        >
            <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 flex-shrink-0">
                    <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded">
                            Article {article.numero}
                        </span>
                        <span className="text-xs font-medium px-2 py-0.5 bg-muted rounded">
                            {NATURE_LABELS[article.texteNature] || article.texteNature}
                        </span>
                        {article.texteEtat && ETAT_LABELS[article.texteEtat] && (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${ETAT_STYLES[article.texteEtat] || ETAT_STYLES.VIGUEUR}`}>
                                {ETAT_LABELS[article.texteEtat]}
                            </span>
                        )}
                        {article.texteDatePublication && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(article.texteDatePublication)}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1.5">
                        {article.texteTitre}
                        {article.texteNumero && <span> &middot; N&deg; {article.texteNumero}</span>}
                    </p>
                    <div
                        className="text-sm leading-relaxed line-clamp-3 [&_mark]:bg-yellow-200 [&_mark]:dark:bg-yellow-800 [&_mark]:px-0.5 [&_mark]:rounded-sm"
                        dangerouslySetInnerHTML={{ __html: displayContent }}
                    />
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
            </div>
        </Link>
    );
}

function SearchResultsWithPagination() {
    const filters = useSearchFilters();
    const nature = filters.type ? TYPE_TO_NATURE[filters.type] : undefined;

    const searchQuery = useSearch(filters.query, {
        nature,
        etat: filters.etat || undefined,
        dateDebut: filters.dateDebut || undefined,
        dateFin: filters.dateFin || undefined,
        page: filters.page,
        limit: 20,
    });

    const listQuery = useLois({
        nature,
        etat: filters.etat || undefined,
        sort: filters.sort,
        order: filters.order,
        dateDebut: filters.dateDebut || undefined,
        dateFin: filters.dateFin || undefined,
        page: filters.page,
        limit: 20,
    });

    const isSearching = filters.query.length > 0;
    const query = isSearching ? searchQuery : listQuery;
    const { isLoading, isError, error } = query;

    // When searching, hits can be textes or articles
    const searchHits: SearchHit[] = isSearching
        ? (searchQuery.data?.hits || [])
        : (listQuery.data?.data || []).map(t => ({ ...t, type: 'texte' as const }));

    const pagination = isSearching
        ? searchQuery.data?.pagination
        : listQuery.data?.pagination;

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="border rounded-lg p-5 animate-pulse">
                        <div className="flex items-start gap-4">
                            <div className="w-11 h-11 bg-muted rounded-lg flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="flex gap-2">
                                    <div className="h-5 w-16 bg-muted rounded" />
                                    <div className="h-5 w-20 bg-muted rounded" />
                                </div>
                                <div className="h-5 w-3/4 bg-muted rounded" />
                                <div className="h-4 w-1/3 bg-muted rounded" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (isError) {
        return (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                <div>
                    <p className="font-medium text-destructive">Erreur lors de la recherche</p>
                    <p className="text-sm text-muted-foreground">
                        {error instanceof Error ? error.message : "Veuillez reessayer plus tard."}
                    </p>
                </div>
            </div>
        );
    }

    if (searchHits.length === 0) {
        return (
            <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Aucun resultat trouve</p>
                <p className="text-muted-foreground mt-1">
                    {filters.query
                        ? `Aucun texte ne correspond a "${filters.query}"`
                        : "Aucun texte disponible pour ces criteres."}
                </p>
            </div>
        );
    }

    const start = (filters.page - 1) * 20 + 1;
    const end = Math.min(filters.page * 20, pagination?.total || 0);

    return (
        <>
            <div className="space-y-4">
                {pagination && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            {pagination.total} resultat{pagination.total > 1 ? "s" : ""}
                            {pagination.total > 20 && (
                                <span> &middot; Affichage {start}-{end}</span>
                            )}
                            {isSearching && searchQuery.data?.processingTimeMs && (
                                <span> &middot; {searchQuery.data.processingTimeMs}ms</span>
                            )}
                        </p>
                    </div>
                )}

                {searchHits.map((hit) =>
                    hit.type === 'article' ? (
                        <ArticleCard key={`article-${hit.id}`} article={hit} />
                    ) : (
                        <TexteCard key={`texte-${hit.id}`} texte={hit} />
                    )
                )}
            </div>
            <Pagination pagination={pagination} />
        </>
    );
}

function Pagination({ pagination }: { pagination?: { page: number; totalPages: number } }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const totalPages = pagination?.totalPages || 1;
    const currentPage = pagination?.page || 1;

    if (totalPages <= 1) return null;

    const goToPage = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", page.toString());
        router.push(`/recherche?${params.toString()}`);
    };

    return (
        <div className="flex items-center justify-between pt-6">
            <p className="text-sm text-muted-foreground">
                Page {currentPage} sur {totalPages}
            </p>
            <div className="flex gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => goToPage(1)}
                    title="Premiere page"
                >
                    <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => goToPage(currentPage - 1)}
                >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1">Precedent</span>
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="bg-primary/10 text-primary"
                >
                    {currentPage}
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => goToPage(currentPage + 1)}
                >
                    <span className="hidden sm:inline mr-1">Suivant</span>
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => goToPage(totalPages)}
                    title="Derniere page"
                >
                    <ChevronsRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

function SearchFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const filters = useSearchFilters();
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const hasAnyFilter = filters.type || filters.etat || filters.dateDebut || filters.dateFin;

    const updateFilter = (key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        params.delete("page"); // Reset page on filter change
        router.push(`/recherche?${params.toString()}`);
    };

    const resetFilters = () => {
        const params = new URLSearchParams();
        if (filters.query) params.set("q", filters.query);
        router.push(`/recherche?${params.toString()}`);
    };

    const filterContent = (
        <div className="space-y-6">
            {/* Active filters summary */}
            {hasAnyFilter && (
                <div className="flex flex-wrap gap-2">
                    {filters.type && (
                        <span className="text-xs font-medium px-3 py-1.5 bg-primary/10 text-primary rounded-full flex items-center gap-1.5">
                            {filters.type}
                            <button onClick={() => updateFilter("type", null)} className="hover:bg-primary/20 rounded-full p-0.5">
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    )}
                    {filters.etat && (
                        <span className="text-xs font-medium px-3 py-1.5 bg-primary/10 text-primary rounded-full flex items-center gap-1.5">
                            {ETAT_LABELS[filters.etat] || filters.etat}
                            <button onClick={() => updateFilter("etat", null)} className="hover:bg-primary/20 rounded-full p-0.5">
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    )}
                    {(filters.dateDebut || filters.dateFin) && (
                        <span className="text-xs font-medium px-3 py-1.5 bg-primary/10 text-primary rounded-full flex items-center gap-1.5">
                            {filters.dateDebut || "..."} - {filters.dateFin || "..."}
                            <button onClick={() => {
                                const params = new URLSearchParams(searchParams.toString());
                                params.delete("dateDebut");
                                params.delete("dateFin");
                                params.delete("page");
                                router.push(`/recherche?${params.toString()}`);
                            }} className="hover:bg-primary/20 rounded-full p-0.5">
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    )}
                    <button
                        onClick={resetFilters}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
                    >
                        Tout effacer
                    </button>
                </div>
            )}

            {/* Type filters */}
            <div className="space-y-4">
                {FILTER_GROUPS.map((group) => (
                    <div key={group.label}>
                        <h3 className="font-medium mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                            {group.label}
                        </h3>
                        <div className="space-y-1">
                            {group.types.map((type) => (
                                <label
                                    key={type}
                                    className="flex items-center gap-2 text-sm cursor-pointer py-1.5 px-2 rounded-lg hover:bg-accent/50 transition-colors"
                                >
                                    <input
                                        type="radio"
                                        name="type-filter"
                                        className="rounded-full border-gray-300 dark:border-gray-600 text-primary"
                                        checked={filters.type === type}
                                        onChange={() => updateFilter("type", filters.type === type ? null : type)}
                                    />
                                    <span className={filters.type === type ? "font-medium text-primary" : ""}>
                                        {type}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Etat filter */}
            <div>
                <h3 className="font-medium mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                    Etat du texte
                </h3>
                <div className="space-y-1">
                    {Object.entries(ETAT_LABELS).map(([value, label]) => (
                        <label
                            key={value}
                            className="flex items-center gap-2 text-sm cursor-pointer py-1.5 px-2 rounded-lg hover:bg-accent/50 transition-colors"
                        >
                            <input
                                type="radio"
                                name="etat-filter"
                                className="rounded-full border-gray-300 dark:border-gray-600 text-primary"
                                checked={filters.etat === value}
                                onChange={() => updateFilter("etat", filters.etat === value ? null : value)}
                            />
                            <span className={filters.etat === value ? "font-medium text-primary" : ""}>
                                {label}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Date range */}
            <div>
                <h3 className="font-medium mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                    Periode de publication
                </h3>
                <div className="space-y-2">
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Du</label>
                        <input
                            type="date"
                            className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            value={filters.dateDebut || ""}
                            onChange={(e) => updateFilter("dateDebut", e.target.value || null)}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Au</label>
                        <input
                            type="date"
                            className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            value={filters.dateFin || ""}
                            onChange={(e) => updateFilter("dateFin", e.target.value || null)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop sidebar */}
            <aside className="hidden md:block w-64 flex-shrink-0">
                <div className="sticky top-20 space-y-4">
                    <div className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        <h2 className="font-semibold text-lg">Filtres</h2>
                    </div>
                    {filterContent}
                </div>
            </aside>

            {/* Mobile filter button */}
            <button
                onClick={() => setShowMobileFilters(true)}
                className="md:hidden fixed bottom-6 left-6 z-40 bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:opacity-90 transition-opacity"
                aria-label="Filtres"
            >
                <SlidersHorizontal className="h-5 w-5" />
            </button>

            {/* Mobile filter sheet */}
            {showMobileFilters && (
                <div className="md:hidden fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)} />
                    <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl max-h-[80vh] flex flex-col animate-in slide-in-from-bottom duration-200">
                        <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
                            <h2 className="font-semibold flex items-center gap-2">
                                <Filter className="h-5 w-5" />
                                Filtres
                            </h2>
                            <button onClick={() => setShowMobileFilters(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1">
                            {filterContent}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function SortSelector() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const filters = useSearchFilters();

    // Don't show sort when using full-text search (Meilisearch sorts by relevance)
    if (filters.query) return null;

    const currentSort = `${filters.sort}:${filters.order}`;

    const handleSort = (value: string) => {
        const [sort, order] = value.split(":");
        const params = new URLSearchParams(searchParams.toString());
        params.set("sort", sort);
        params.set("order", order);
        params.delete("page");
        router.push(`/recherche?${params.toString()}`);
    };

    return (
        <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <select
                value={currentSort}
                onChange={(e) => handleSort(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
                {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
}

function SearchHeader() {
    const filters = useSearchFilters();

    let title = "Recherche";
    let subtitle = "Explorez les textes legislatifs et reglementaires de la Republique de Guinee";

    if (filters.type && !filters.query) {
        title = filters.type;
        subtitle = `Tous les textes de type « ${filters.type} »`;
    } else if (filters.query) {
        title = `Resultats pour « ${filters.query} »`;
        const parts: string[] = [];
        if (filters.type) parts.push(filters.type);
        if (filters.etat) parts.push(ETAT_LABELS[filters.etat] || filters.etat);
        if (filters.dateDebut || filters.dateFin) {
            parts.push(`${filters.dateDebut || "..."} - ${filters.dateFin || "..."}`);
        }
        subtitle = parts.length > 0
            ? `Filtre par : ${parts.join(" · ")}`
            : "Recherche dans tous les textes";
    }

    return (
        <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
            <p className="mt-1 text-muted-foreground">{subtitle}</p>
        </div>
    );
}

export default function SearchPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <div className="flex-1 container py-8 px-4 md:px-6">
                <Suspense fallback={<div className="h-16" />}>
                    <SearchHeader />
                </Suspense>

                <div className="flex flex-col md:flex-row gap-8">
                    <Suspense fallback={<div className="w-64 animate-pulse"><div className="h-64 bg-muted rounded-lg" /></div>}>
                        <SearchFilters />
                    </Suspense>

                    <main className="flex-1 space-y-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="flex-1 w-full">
                                <SearchBar className="max-w-full" showFilters={false} />
                            </div>
                            <Suspense fallback={null}>
                                <SortSelector />
                            </Suspense>
                        </div>

                        <Suspense
                            fallback={
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            }
                        >
                            <SearchResultsWithPagination />
                        </Suspense>
                    </main>
                </div>
            </div>
            <Footer />
        </div>
    );
}
