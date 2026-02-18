"use client";

import * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
    children: React.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
    attribute?: string;
    enableSystem?: boolean;
    disableTransitionOnChange?: boolean;
};

type ThemeProviderState = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    resolvedTheme: "dark" | "light";
};

const initialState: ThemeProviderState = {
    theme: "system",
    setTheme: () => null,
    resolvedTheme: "light",
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
    children,
    defaultTheme = "system",
    storageKey = "legifrance-guinee-theme",
    attribute = "class",
    enableSystem = true,
    disableTransitionOnChange = true,
    ...props
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(defaultTheme);
    const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("light");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem(storageKey) as Theme | null;
        if (stored) {
            setTheme(stored);
        }
    }, [storageKey]);

    useEffect(() => {
        if (!mounted) return;

        const root = window.document.documentElement;

        // Disable transitions temporarily
        if (disableTransitionOnChange) {
            root.classList.add("[&_*]:!transition-none");
            window.setTimeout(() => {
                root.classList.remove("[&_*]:!transition-none");
            }, 0);
        }

        // Remove old theme classes
        root.classList.remove("light", "dark");

        let resolvedValue: "dark" | "light" = "light";

        if (theme === "system" && enableSystem) {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light";
            resolvedValue = systemTheme;
        } else if (theme === "dark" || theme === "light") {
            resolvedValue = theme;
        }

        setResolvedTheme(resolvedValue);

        if (attribute === "class") {
            root.classList.add(resolvedValue);
        } else {
            root.setAttribute(attribute, resolvedValue);
        }
    }, [theme, mounted, attribute, enableSystem, disableTransitionOnChange]);

    // Listen for system theme changes
    useEffect(() => {
        if (!enableSystem || theme !== "system") return;

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

        const handleChange = (e: MediaQueryListEvent) => {
            setResolvedTheme(e.matches ? "dark" : "light");
            const root = window.document.documentElement;
            root.classList.remove("light", "dark");
            root.classList.add(e.matches ? "dark" : "light");
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, [enableSystem, theme]);

    const value = {
        theme,
        setTheme: (newTheme: Theme) => {
            localStorage.setItem(storageKey, newTheme);
            setTheme(newTheme);
        },
        resolvedTheme,
    };

    // Prevent flash of wrong theme
    if (!mounted) {
        return <div style={{ visibility: "hidden" }}>{children}</div>;
    }

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext);

    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider");

    return context;
};
