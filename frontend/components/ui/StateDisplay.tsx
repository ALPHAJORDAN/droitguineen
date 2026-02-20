"use client";

import { Loader2, AlertCircle, FileText } from "lucide-react";

interface LoadingStateProps {
    variant?: "spinner" | "skeleton";
    skeletonCount?: number;
    message?: string;
}

export function LoadingState({ variant = "spinner", skeletonCount = 5, message = "Chargement..." }: LoadingStateProps) {
    if (variant === "skeleton") {
        return (
            <div className="space-y-4">
                {[...Array(skeletonCount)].map((_, i) => (
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

    return (
        <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">{message}</span>
        </div>
    );
}

interface ErrorAlertProps {
    title?: string;
    message: string;
}

export function ErrorAlert({ title = "Erreur", message }: ErrorAlertProps) {
    return (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
            <div>
                <p className="font-medium text-destructive">{title}</p>
                <p className="text-sm text-muted-foreground">{message}</p>
            </div>
        </div>
    );
}

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
    return (
        <div className="text-center py-12 text-muted-foreground">
            <div className="flex justify-center mb-4">
                {icon || <FileText className="h-12 w-12 opacity-50" />}
            </div>
            <p className="text-lg font-medium">{title}</p>
            {description && <p className="text-sm mt-1">{description}</p>}
        </div>
    );
}
