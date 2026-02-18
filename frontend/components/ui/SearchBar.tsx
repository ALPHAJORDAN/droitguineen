"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface SearchBarProps extends React.HTMLAttributes<HTMLDivElement> {
    onSearch?: (query: string) => void;
    defaultValue?: string;
    showFilters?: boolean;
}

const quickFilters = [
    { label: "Constitution", href: "/recherche?type=Constitution" },
    { label: "Lois", href: "/recherche?type=Lois" },
    { label: "Codes", href: "/recherche?type=Codes" },
    { label: "Décrets", href: "/recherche?type=Décrets" },
    { label: "Jurisprudence", href: "/recherche?type=Jurisprudence" },
];

export function SearchBar({ className, onSearch, defaultValue = "", showFilters = true, ...props }: SearchBarProps) {
    const [query, setQuery] = React.useState(defaultValue);
    const [isFocused, setIsFocused] = React.useState(false);
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            if (onSearch) {
                onSearch(query);
            } else {
                router.push(`/recherche?q=${encodeURIComponent(query)}`);
            }
        }
    };

    const handleFilterClick = (href: string) => {
        router.push(href);
    };

    return (
        <div className={cn("w-full space-y-6", className)} {...props}>
            {/* Main Search Bar */}
            <form onSubmit={handleSubmit} className="w-full">
                <div
                    className={cn(
                        "relative w-full max-w-3xl mx-auto",
                        "bg-card rounded-full shadow-lg",
                        "transition-all duration-300 ease-out",
                        isFocused && "shadow-2xl scale-[1.02]"
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
                            className="flex-1 bg-transparent text-base sm:text-lg outline-none placeholder:text-muted-foreground"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSubmit(e);
                                }
                            }}
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery("")}
                                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-accent"
                                aria-label="Clear search"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
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
