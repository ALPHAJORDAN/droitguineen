import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string): string {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

/** Sanitize article numero for use as HTML ID attribute */
export function articleId(numero: string): string {
    return `article-${numero.replace(/[^a-zA-Z0-9-_]/g, '-')}`;
}

/** Shared ETAT_STYLES mapping used across all pages */
export const ETAT_STYLES: Record<string, string> = {
    VIGUEUR: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    VIGUEUR_DIFF: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    MODIFIE: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    ABROGE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    ABROGE_DIFF: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    PERIME: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};
