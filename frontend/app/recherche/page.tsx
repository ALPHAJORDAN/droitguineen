"use client";

import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { SearchBar } from "@/components/ui/SearchBar";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { FileText, Filter, Loader2, AlertCircle } from "lucide-react";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSearch, useLois } from "@/lib/hooks";
import { NATURE_LABELS, Texte } from "@/lib/api";
import { formatDate } from "@/lib/utils";

// Map frontend type filters to backend nature values
const TYPE_TO_NATURE: Record<string, string> = {
    "Lois": "LOI",
    "Décrets": "DECRET",
    "Arrêtés": "ARRETE",
    "Codes": "CODE",
    "Ordonnances": "ORDONNANCE",
    "Jurisprudence": "JURISPRUDENCE",
};

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
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Chargement...</span>
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
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
                <div
                    key={texte.id}
                    className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center flex-wrap gap-2 mb-1">
                                <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded">
                                    {NATURE_LABELS[texte.nature] || texte.nature}
                                </span>
                                {texte.etat && texte.etat !== "VIGUEUR" && (
                                    <span className="text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded">
                                        {texte.etat === "ABROGE" ? "Abrogé" : texte.etat}
                                    </span>
                                )}
                                {texte.datePublication && (
                                    <span className="text-xs text-muted-foreground">
                                        {formatDate(texte.datePublication)}
                                    </span>
                                )}
                            </div>
                            <Link
                                href={`/lois/${texte.id}`}
                                className="text-lg font-semibold text-primary hover:underline block"
                            >
                                {texte.titre}
                            </Link>
                            {texte.numero && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    N° {texte.numero}
                                </p>
                            )}
                        </div>
                        <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-4" />
                    </div>
                </div>
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

    const handleTypeChange = (type: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (currentType === type) {
            params.delete("type");
        } else {
            params.set("type", type);
        }
        params.delete("page"); // Reset to page 1
        router.push(`/recherche?${params.toString()}`);
    };

    const resetFilters = () => {
        router.push("/recherche");
    };

    const types = ["Lois", "Décrets", "Ordonnances", "Arrêtés", "Codes"];

    return (
        <aside className="w-full md:w-64 space-y-6">
            <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <h2 className="font-semibold text-lg">Filtres</h2>
            </div>

            <div className="space-y-4">
                <div>
                    <h3 className="font-medium mb-2 text-sm text-muted-foreground">
                        Type de texte
                    </h3>
                    <div className="space-y-2">
                        {types.map((type) => (
                            <label
                                key={type}
                                className="flex items-center space-x-2 text-sm cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 dark:border-gray-600"
                                    checked={currentType === type}
                                    onChange={() => handleTypeChange(type)}
                                />
                                <span>{type}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <Button variant="outline" className="w-full" onClick={resetFilters}>
                    Réinitialiser les filtres
                </Button>
            </div>
        </aside>
    );
}

export default function SearchPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <div className="flex-1 container py-8 px-4 md:px-6">
                <div className="flex flex-col md:flex-row gap-8">
                    <Suspense fallback={<div className="w-64">Chargement...</div>}>
                        <SearchFilters />
                    </Suspense>

                    <main className="flex-1 space-y-6">
                        <div className="flex flex-col space-y-4">
                            <SearchBar className="max-w-full" />
                        </div>

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
