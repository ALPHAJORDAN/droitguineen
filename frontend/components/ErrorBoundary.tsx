"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    ErrorBoundaryState
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-[50vh] items-center justify-center p-8">
                    <div className="text-center space-y-4 max-w-md">
                        <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
                        <h2 className="text-xl font-semibold">
                            Une erreur est survenue
                        </h2>
                        <p className="text-muted-foreground text-sm">
                            {this.state.error?.message || "Veuillez reessayer."}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                            Reessayer
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
