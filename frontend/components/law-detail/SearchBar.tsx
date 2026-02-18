"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
    onSearch: (query: string) => void;
    resultCount: number;
}

export function SearchBar({ onSearch, resultCount }: SearchBarProps) {
    const [value, setValue] = useState("");
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => {
        debounceRef.current = setTimeout(() => {
            onSearch(value.trim());
        }, 300);
        return () => clearTimeout(debounceRef.current);
    }, [value, onSearch]);

    const clear = () => {
        setValue("");
        onSearch("");
    };

    return (
        <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Rechercher dans le texte..."
                    className="w-full border rounded-lg pl-9 pr-10 py-2 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                />
                {value && (
                    <button
                        onClick={clear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
            {value.trim() && (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {resultCount} article{resultCount !== 1 ? "s" : ""}
                </span>
            )}
        </div>
    );
}
