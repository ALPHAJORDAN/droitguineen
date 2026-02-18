"use client";

import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { useLois } from "@/lib/hooks";
import { NATURE_LABELS, Texte } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Scale, FileText, BookOpen, Calendar, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";

const NATURE_ICONS: Record<string, React.ReactNode> = {
    LOI: <Scale className="h-5 w-5" />,
    LOI_ORGANIQUE: <Scale className="h-5 w-5" />,
    LOI_CONSTITUTIONNELLE: <BookOpen className="h-5 w-5" />,
    ORDONNANCE: <FileText className="h-5 w-5" />,
    DECRET: <FileText className="h-5 w-5" />,
};

export default function LoisPage() {
    const [filter, setFilter] = useState<string>("");

    const { data, isLoading, isError, error } = useLois({
        limit: 50,
        nature: filter || undefined,
    });

    const textes = data?.data || [];

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 container py-8 px-4 md:px-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Les Lois et Textes Juridiques</h1>
                    <p className="text-muted-foreground">
                        Consultez l&apos;ensemble des textes législatifs et réglementaires de la République de Guinée.
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-6">
                    <button
                        onClick={() => setFilter("")}
                        className={`px-4 py-2 rounded-full text-sm transition-colors ${filter === "" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                            }`}
                    >
                        Tous
                    </button>
                    {["CODE", "LOI", "DECRET", "ORDONNANCE", "LOI_CONSTITUTIONNELLE"].map((nature) => (
                        <button
                            key={nature}
                            onClick={() => setFilter(nature)}
                            className={`px-4 py-2 rounded-full text-sm transition-colors ${filter === nature ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                                }`}
                        >
                            {NATURE_LABELS[nature]}
                        </button>
                    ))}
                </div>

                {/* Error State */}
                {isError && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6 flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        <p className="text-destructive">
                            {error instanceof Error ? error.message : "Impossible de charger les textes. Vérifiez que le serveur backend est démarré."}
                        </p>
                    </div>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2 text-muted-foreground">Chargement des textes...</span>
                    </div>
                )}

                {/* Textes List */}
                {!isLoading && !isError && (
                    <div className="grid gap-4">
                        {textes.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Aucun texte trouvé.</p>
                            </div>
                        ) : (
                            textes.map((texte: Texte) => (
                                <Link
                                    key={texte.id}
                                    href={`/lois/${texte.id}`}
                                    className="group border rounded-lg p-6 hover:border-primary hover:shadow-md transition-all"
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
                                            </div>
                                            <h2 className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-2">
                                                {texte.titre}
                                            </h2>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                                {texte.numero && (
                                                    <span>{texte.numero}</span>
                                                )}
                                                {texte.datePublication && (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {formatDate(texte.datePublication)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                )}

                {/* Results count */}
                {!isLoading && !isError && data?.pagination && (
                    <div className="mt-6 text-sm text-muted-foreground text-center">
                        {data.pagination.total} texte{data.pagination.total > 1 ? "s" : ""} trouvé{data.pagination.total > 1 ? "s" : ""}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
