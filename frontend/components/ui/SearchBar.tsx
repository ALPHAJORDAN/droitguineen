"use client"

import * as React from "react"
import { Search, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useSuggestions } from "@/lib/hooks"
import { NATURE_LABELS, type SearchHit, type ArticleHit, type Texte } from "@/lib/api"
import DOMPurify from "isomorphic-dompurify"

interface SearchBarProps extends React.HTMLAttributes<HTMLDivElement> {
    onSearch?: (query: string) => void;
    defaultValue?: string;
    showFilters?: boolean;
}

const quickFilters = [
    { label: "Constitution", href: "/recherche?type=Constitution" },
    { label: "Lois", href: "/recherche?type=Lois" },
    { label: "Codes", href: "/recherche?type=Codes" },
    { label: "Décrets", href: "/recherche?type=Decrets" },
    { label: "Jurisprudence", href: "/recherche?type=Jurisprudence" },
];

function SuggestionArticle({ article }: { article: ArticleHit }) {
    const preview = article._formatted?.contenu || article.contenu;
    const plainPreview = DOMPurify.sanitize(preview, { ALLOWED_TAGS: [] }).slice(0, 80);

    return (
        <>
            <div className="flex-shrink-0 mt-1">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
            </div>
            <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                    Article {article.numero} — {article.texteTitre}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                    {plainPreview}{plainPreview.length >= 80 ? "..." : ""}
                </p>
            </div>
        </>
    );
}

function SuggestionTexte({ texte }: { texte: Texte & { type: "texte" } }) {
    return (
        <>
            <div className="flex-shrink-0 mt-1">
                <span className="inline-block w-2 h-2 rounded-full bg-primary" />
            </div>
            <div className="min-w-0">
                <p className="text-sm font-medium truncate">{texte.titre}</p>
                <span className="text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                    {NATURE_LABELS[texte.nature] || texte.nature}
                </span>
            </div>
        </>
    );
}

export function SearchBar({ className, onSearch, defaultValue = "", showFilters = true, ...props }: SearchBarProps) {
    const [query, setQuery] = React.useState(defaultValue);
    const [isFocused, setIsFocused] = React.useState(false);
    const [debouncedQuery, setDebouncedQuery] = React.useState("");
    const [showSuggestions, setShowSuggestions] = React.useState(false);
    const [selectedIndex, setSelectedIndex] = React.useState(-1);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const debounceTimerRef = React.useRef<ReturnType<typeof setTimeout>>(null);
    const router = useRouter();

    const { data: suggestionsData, isLoading: suggestionsLoading } = useSuggestions(debouncedQuery);
    const suggestions: SearchHit[] = suggestionsData?.hits ?? [];

    // Click-outside handler
    React.useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        setSelectedIndex(-1);

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        if (value.trim().length >= 2) {
            debounceTimerRef.current = setTimeout(() => {
                setDebouncedQuery(value.trim());
                setShowSuggestions(true);
            }, 200);
        } else {
            setShowSuggestions(false);
            setDebouncedQuery("");
        }
    }, []);

    const navigateToHit = React.useCallback((hit: SearchHit) => {
        setShowSuggestions(false);
        if (hit.type === "article") {
            router.push(`/lois/${hit.texteId}?article=${hit.numero}`);
        } else {
            router.push(`/lois/${hit.id}`);
        }
    }, [router]);

    const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            setShowSuggestions(false);
            setSelectedIndex(-1);
            return;
        }
        if (!showSuggestions || suggestions.length === 0) return;

        const maxIndex = suggestions.length; // last index = "see all results" button
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, maxIndex));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, -1));
        } else if (e.key === "Enter" && selectedIndex >= 0) {
            e.preventDefault();
            if (selectedIndex < suggestions.length) {
                navigateToHit(suggestions[selectedIndex]);
            } else {
                setShowSuggestions(false);
                router.push(`/recherche?q=${encodeURIComponent(debouncedQuery)}`);
            }
        }
    }, [showSuggestions, suggestions, selectedIndex, navigateToHit]);

    const handleSubmit = React.useCallback((e: React.FormEvent) => {
        e.preventDefault();
        setShowSuggestions(false);
        if (query.trim()) {
            if (onSearch) {
                onSearch(query);
            } else {
                router.push(`/recherche?q=${encodeURIComponent(query)}`);
            }
        }
    }, [query, onSearch, router]);

    const handleFilterClick = React.useCallback((href: string) => {
        router.push(href);
    }, [router]);

    return (
        <div ref={containerRef} className={cn("w-full space-y-6", className)} {...props}>
            {/* Main Search Bar */}
            <form onSubmit={handleSubmit} className="w-full">
                <div className="relative w-full max-w-3xl mx-auto">
                    <div
                        className={cn(
                            "bg-card shadow-lg",
                            "transition-all duration-300 ease-out",
                            showSuggestions && suggestions.length > 0
                                ? "rounded-t-3xl shadow-2xl"
                                : "rounded-full",
                            isFocused && !showSuggestions && "shadow-2xl scale-[1.02]"
                        )}
                    >
                        <div className="flex items-center h-14 sm:h-16 px-6 gap-4">
                            <Search className={cn(
                                "h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 transition-colors duration-200",
                                isFocused ? "text-primary" : "text-muted-foreground"
                            )} />
                            <input
                                type="text"
                                placeholder="Rechercher une loi, un code, un décret..."
                                aria-label="Rechercher dans les textes juridiques"
                                className="flex-1 bg-transparent text-base sm:text-lg outline-none placeholder:text-muted-foreground"
                                value={query}
                                onChange={handleInputChange}
                                onFocus={() => {
                                    setIsFocused(true);
                                    if (debouncedQuery.length >= 2) setShowSuggestions(true);
                                }}
                                onBlur={() => setIsFocused(false)}
                                onKeyDown={handleKeyDown}
                            />
                            {query && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setQuery("");
                                        setDebouncedQuery("");
                                        setShowSuggestions(false);
                                    }}
                                    className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-accent"
                                    aria-label="Effacer"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            )}
                            <button
                                type="submit"
                                className={cn(
                                    "flex-shrink-0 px-4 sm:px-6 py-2 rounded-full text-sm font-medium",
                                    "bg-primary text-primary-foreground hover:bg-primary/90",
                                    "transition-all duration-200"
                                )}
                            >
                                <Search className="h-4 w-4 sm:hidden" />
                                <span className="hidden sm:inline">Rechercher</span>
                            </button>
                        </div>
                    </div>

                    {/* Suggestions Dropdown */}
                    {showSuggestions && debouncedQuery.length >= 2 && (
                        <div role="listbox" aria-label="Suggestions de recherche" className="absolute left-0 right-0 z-50 bg-card border-t border-border/50 rounded-b-2xl shadow-2xl overflow-hidden">
                            {suggestionsLoading && suggestions.length === 0 ? (
                                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                                    Recherche...
                                </div>
                            ) : suggestions.length === 0 ? (
                                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                                    Aucun resultat pour &laquo; {debouncedQuery} &raquo;
                                </div>
                            ) : (
                                <>
                                    {(() => {
                                        const articles = suggestions.filter(h => h.type === "article");
                                        const textes = suggestions.filter(h => h.type === "texte");
                                        let flatIndex = 0;
                                        const items: React.ReactNode[] = [];

                                        if (articles.length > 0) {
                                            items.push(
                                                <div key="label-articles" className="px-4 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                                                    Articles
                                                </div>
                                            );
                                            for (const hit of articles) {
                                                const idx = flatIndex++;
                                                items.push(
                                                    <button
                                                        key={`article-${hit.id}`}
                                                        className={cn(
                                                            "w-full text-left px-4 py-2.5 flex items-start gap-3",
                                                            "hover:bg-accent/50 transition-colors",
                                                            selectedIndex === idx && "bg-accent/50"
                                                        )}
                                                        onMouseEnter={() => setSelectedIndex(idx)}
                                                        onMouseDown={(e) => { e.preventDefault(); navigateToHit(hit); }}
                                                        role="option"
                                                        aria-selected={selectedIndex === idx}
                                                    >
                                                        <SuggestionArticle article={hit as ArticleHit} />
                                                    </button>
                                                );
                                            }
                                        }

                                        if (textes.length > 0) {
                                            items.push(
                                                <div key="label-textes" className="px-4 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 border-t border-border/30">
                                                    Textes juridiques
                                                </div>
                                            );
                                            for (const hit of textes) {
                                                const idx = flatIndex++;
                                                items.push(
                                                    <button
                                                        key={`texte-${hit.id}`}
                                                        className={cn(
                                                            "w-full text-left px-4 py-2.5 flex items-start gap-3",
                                                            "hover:bg-accent/50 transition-colors",
                                                            selectedIndex === idx && "bg-accent/50"
                                                        )}
                                                        onMouseEnter={() => setSelectedIndex(idx)}
                                                        onMouseDown={(e) => { e.preventDefault(); navigateToHit(hit); }}
                                                        role="option"
                                                        aria-selected={selectedIndex === idx}
                                                    >
                                                        <SuggestionTexte texte={hit as Texte & { type: "texte" }} />
                                                    </button>
                                                );
                                            }
                                        }

                                        return items;
                                    })()}
                                    <button
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            setShowSuggestions(false);
                                            router.push(`/recherche?q=${encodeURIComponent(debouncedQuery)}`);
                                        }}
                                        onMouseEnter={() => setSelectedIndex(suggestions.length)}
                                        className={cn(
                                            "w-full text-center px-4 py-2.5 text-sm text-primary font-medium hover:bg-accent/30 transition-colors border-t border-border/50",
                                            selectedIndex === suggestions.length && "bg-accent/30"
                                        )}
                                    >
                                        Voir tous les résultats pour &laquo; {debouncedQuery} &raquo;
                                    </button>
                                    <div className="hidden sm:flex items-center justify-center gap-3 px-4 py-1.5 text-[10px] text-muted-foreground/50 border-t border-border/30">
                                        <span><kbd className="px-1 py-0.5 rounded border border-border/50 font-mono">↑↓</kbd> naviguer</span>
                                        <span><kbd className="px-1 py-0.5 rounded border border-border/50 font-mono">Entrée</kbd> valider</span>
                                        <span><kbd className="px-1 py-0.5 rounded border border-border/50 font-mono">Esc</kbd> fermer</span>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </form>

            {/* Quick Filter Pills */}
            {showFilters && (
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                    {quickFilters.map((filter) => (
                        <button
                            key={filter.label}
                            onClick={() => handleFilterClick(filter.href)}
                            className={cn(
                                "px-4 sm:px-6 py-2 rounded-full text-sm font-medium",
                                "bg-accent/50 hover:bg-accent text-accent-foreground",
                                "transition-all duration-200 hover:scale-105",
                                "border border-border/50"
                            )}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
