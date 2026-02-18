import { CheckCircle, RefreshCw, AlertCircle } from "lucide-react";

export function StatusBadge({ status }: { status: string }) {
    if (status === "processed") {
        return (
            <span className="flex items-center text-green-600 dark:text-green-400">
                <CheckCircle className="h-3 w-3 mr-1" /> Traité
            </span>
        );
    }
    if (status === "processing") {
        return (
            <span className="flex items-center text-amber-600 dark:text-amber-400">
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> En cours
            </span>
        );
    }
    return (
        <span className="flex items-center text-red-600 dark:text-red-400">
            <AlertCircle className="h-3 w-3 mr-1" /> Erreur
        </span>
    );
}
