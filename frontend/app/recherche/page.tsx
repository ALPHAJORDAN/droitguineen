"use client";

import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { SearchBar } from "@/components/ui/SearchBar";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import {
    FileText, Filter, Loader2, AlertCircle, Calendar, ArrowRight,
    Scale, BookOpen, Gavel, FileCheck, ScrollText, X
} from "lucide-react";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSearch, useLois } from "@/lib/hooks";
import { NATURE_LABELS, Texte } from "@/lib/api";
import { formatDate } from "@/lib/utils";

// Map frontend type filters to backend nature values
const TYPE_TO_NATURE: Record<string, string> = {
    "Constitution": "LOI_CONSTITUTIONNELLE",
    "Lois": "LOI",
    "Lois organiques": "LOI_ORGANIQUE",
    "Ordonnances": "ORDONNANCE",
    "Décrets": "DECRET",
    "Décrets-lois": "DECRET_LOI",
    "Arrêtés": "ARRETE",
    "Circulaires": "CIRCULAIRE",
    "Décisions": "DECISION",
    "Conventions": "CONVENTION",
    "Traités": "TRAITE",
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
        label: "Textes législatifs",
        types: ["Constitution", "Lois", "Lois organiques", "Ordonnances"],
    },
    {
        label: "Textes réglementaires",
        types: ["Décrets", "Arrêtés", "Circulaires", "Décisions"],
    },
    {
        label: "Autres",
        types: ["Codes", "Jurisprudence", "Traités", "Conventions"],
    },
];

function SearchResults() {
    const searchParams = useSearchParams();
    const typeFilter = searchParams.get("type");
    const queryFilter = searchParams.get("query") || searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);

    // Convert frontend type to backend nature
    const nature = typeFilter ? TYPE_TO_NATURE[typeFilter] : undefined;

    // Use search if there's a query, otherwise use list
    const searchQuery = useSearch(queryFilter, {
        nature,
        page,
        limit: 20,
    });

    const listQuery = useLois({
        nature,
        page,
        limit: 20,
    });

    // Use search results if there's a query, otherwise use list
    const isSearching = queryFilter.length > 0;
    const query = isSearching ? searchQuery : listQuery;
    const { isLoading, isError, error } = query;

    // Get the results based on which query we're using
    const results: Texte[] = isSearching
        ? (searchQuery.data?.hits || [])
        : (listQuery.data?.data || []);

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
                        {error instanceof Error ? error.message : "Veuillez réessayer plus tard."}
                    </p>
                </div>
            </div>
        );
    }

    if (results.length === 0) {
        return (
            <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Aucun résultat trouvé</p>
                <p className="text-muted-foreground mt-1">
                    {queryFilter
                        ? `Aucun texte ne correspond à "${queryFilter}"`
                        : "Aucun texte disponible pour ces critères."}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {pagination && (
                <p className="text-sm text-muted-foreground">
                    {pagination.total} résultat{pagination.total > 1 ? "s" : ""} trouvé{pagination.total > 1 ? "s" : ""}
                    {isSearching && searchQuery.data?.processingTimeMs && (
                        <span> ({searchQuery.data.processingTimeMs}ms)</span>
                    )}
                </p>
            )}

            {results.map((texte) => (
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
                                {texte.etat === "VIGUEUR" && (
                                    <span className="text-xs font-medium px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                                        En vigueur
                                    </span>
                                )}
                                {texte.etat === "ABROGE" && (
                                    <span className="text-xs font-medium px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded">
                                        Abrogé
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
                            {texte.numero && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    N° {texte.numero}
                                </p>
                            )}
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                    </div>
                </Link>
            ))}
        </div>
    );
}

function Pagination() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentPage = parseInt(searchParams.get("page") || "1", 10);

    const goToPage = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", page.toString());
        router.push(`/recherche?${params.toString()}`);
    };

    return (
        <div className="flex justify-center pt-8">
            <div className="flex space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => goToPage(currentPage - 1)}
                >
                    Précédent
                </Button>
                <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
                    {currentPage}
                </Button>
                <Button variant="outline" size="sm" onClick={() => goToPage(currentPage + 1)}>
                    Suivant
                </Button>
            </div>
        </div>
    );
}

function SearchFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentType = searchParams.get("type");
    const currentQuery = searchParams.get("q") || searchParams.get("query") || "";

    const handleTypeChange = (type: string) => {
        const params = new URLSearchParams();
        if (currentQuery) params.set("q", currentQuery);
        if (currentType === type) {
            // Deselect
        } else {
            params.set("type", type);
        }
        router.push(`/recherche?${params.toString()}`);
    };

    const resetFilters = () => {
        if (currentQuery) {
            router.push(`/recherche?q=${encodeURIComponent(currentQuery)}`);
        } else {
            router.push("/recherche");
        }
    };

    return (
        <aside className="w-full md:w-64 flex-shrink-0 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    <h2 className="font-semibold text-lg">Filtres</h2>
                </div>
                {currentType && (
                    <button
                        onClick={resetFilters}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Réinitialiser
                    </button>
                )}
            </div>

            {/* Active filter badge */}
            {currentType && (
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium px-3 py-1.5 bg-primary/10 text-primary rounded-full flex items-center gap-1.5">
                        {currentType}
                        <button onClick={resetFilters} className="hover:bg-primary/20 rounded-full p-0.5">
                            <X className="h-3 w-3" />
                        </button>
                    </span>
                </div>
            )}

            <div className="space-y-5">
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
                                        checked={currentType === type}
                                        onChange={() => handleTypeChange(type)}
                                    />
                                    <span className={currentType === type ? "font-medium text-primary" : ""}>
                                        {type}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </aside>
    );
}

function SearchHeader() {
    const searchParams = useSearchParams();
    const currentType = searchParams.get("type");
    const currentQuery = searchParams.get("q") || searchParams.get("query") || "";

    let title = "Recherche";
    let subtitle = "Explorez les textes législatifs et réglementaires de la République de Guinée";

    if (currentType && !currentQuery) {
        title = currentType;
        subtitle = `Tous les textes de type « ${currentType} »`;
    } else if (currentQuery) {
        title = `Résultats pour « ${currentQuery} »`;
        subtitle = currentType ? `Filtré par : ${currentType}` : "Recherche dans tous les textes";
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
                        <SearchBar className="max-w-full" showFilters={false} />

                        <Suspense
                            fallback={
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            }
                        >
                            <SearchResults />
                        </Suspense>

                        <Suspense fallback={null}>
                            <Pagination />
                        </Suspense>
                    </main>
                </div>
            </div>
            <Footer />
        </div>
    );
}
