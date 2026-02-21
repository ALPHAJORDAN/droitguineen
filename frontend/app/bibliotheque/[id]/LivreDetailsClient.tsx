"use client";

import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { Button } from "@/components/ui/Button";
import { useLivre } from "@/lib/hooks";
import { CATEGORIE_LIVRE_LABELS, Article, getLivreExportPdfUrl } from "@/lib/api";
import {
    ChevronRight, BookOpen, AlertCircle, ArrowLeft,
    Loader2, Type, User, Calendar, Hash, Download, Share2,
} from "lucide-react";
import Link from "next/link";
import { CodeViewer } from "@/components/CodeViewer";
import { useState, useEffect, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";

export function LivreDetailsClient({ id }: { id: string }) {
    const { data: livre, isLoading, isError, error } = useLivre(id);
    const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('sm');
    const [copied, setCopied] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Map chapters to Article interface for CodeViewer reuse
    const articles: Article[] = useMemo(() => {
        if (!livre?.chapitres?.length) return [];
        return livre.chapitres.map((ch) => ({
            id: ch.id,
            cid: ch.id,
            numero: `Chapitre ${ch.ordre} - ${ch.titre}`,
            contenu: ch.contenu,
            etat: "VIGUEUR",
            ordre: ch.ordre,
        }));
    }, [livre?.chapitres]);

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard API not available
        }
    };

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
    }, []);

    if (isLoading) {
        return (
            <div className="flex min-h-screen flex-col">
                <Header />
                <div className="flex-1 container py-8 px-4 md:px-6">
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2 text-muted-foreground">Chargement du livre...</span>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (isError || !livre) {
        return (
            <div className="flex min-h-screen flex-col">
                <Header />
                <div className="flex-1 container py-8 px-4 md:px-6">
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 flex items-center gap-4">
                        <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0" />
                        <div>
                            <h2 className="font-semibold text-destructive">Erreur</h2>
                            <p className="text-muted-foreground">
                                {error instanceof Error ? error.message : "Impossible de charger ce livre. Il n'existe peut-etre pas."}
                            </p>
                        </div>
                    </div>
                    <Link href="/bibliotheque" className="inline-flex items-center gap-2 mt-6 text-primary hover:underline">
                        <ArrowLeft className="h-4 w-4" />
                        Retour a la bibliotheque
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    const categorieLabel = CATEGORIE_LIVRE_LABELS[livre.categorie] || livre.categorie;

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <div className="flex-1">
                {/* Hero banner */}
                <div className="bg-gradient-to-b from-accent/30 to-background border-b">
                    <div className="container px-4 md:px-6 py-8">
                        {/* Breadcrumb */}
                        <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground mb-6">
                            <Link href="/bibliotheque" className="hover:text-primary transition-colors">Bibliotheque</Link>
                            <ChevronRight className="h-3.5 w-3.5" />
                            <Link
                                href={`/bibliotheque?categorie=${livre.categorie}`}
                                className="hover:text-primary transition-colors"
                            >
                                {categorieLabel}
                            </Link>
                            <ChevronRight className="h-3.5 w-3.5" />
                            <span className="text-foreground line-clamp-1">{livre.titre}</span>
                        </nav>

                        <div className="flex items-start gap-5">
                            {/* Icon */}
                            <div className="hidden sm:flex p-4 bg-primary/10 rounded-2xl text-primary flex-shrink-0">
                                <BookOpen className="h-8 w-8" />
                            </div>

                            <div className="flex-1 min-w-0">
                                {/* Badges */}
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                    <span className="text-xs font-semibold px-2.5 py-1 bg-primary/10 text-primary rounded-full">
                                        {categorieLabel}
                                    </span>
                                </div>

                                {/* Title */}
                                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-4">
                                    {livre.titre}
                                </h1>

                                {/* Metadata row */}
                                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                        <User className="h-3.5 w-3.5" /> {livre.auteur}
                                    </span>
                                    {livre.editeur && (
                                        <span className="flex items-center gap-1.5">
                                            <BookOpen className="h-3.5 w-3.5" /> {livre.editeur}
                                        </span>
                                    )}
                                    {livre.anneePublication && (
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5" /> {livre.anneePublication}
                                        </span>
                                    )}
                                    {livre.isbn && (
                                        <span className="flex items-center gap-1.5">
                                            <Hash className="h-3.5 w-3.5" /> ISBN: {livre.isbn}
                                        </span>
                                    )}
                                    {articles.length > 0 && (
                                        <span className="flex items-center gap-1.5">
                                            <BookOpen className="h-3.5 w-3.5" /> {articles.length} chapitre{articles.length > 1 ? "s" : ""}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-5 border-t border-border/50">
                            <div className="flex items-center gap-2">
                                {livre.fichierPdf && (
                                    <a href={getLivreExportPdfUrl(livre.id)} target="_blank" rel="noopener noreferrer">
                                        <Button variant="outline" size="sm">
                                            <Download className="mr-2 h-4 w-4" /> Telecharger PDF
                                        </Button>
                                    </a>
                                )}
                                <Button variant="outline" size="sm" onClick={handleShare}>
                                    <Share2 className="mr-2 h-4 w-4" />
                                    {copied ? "Copie !" : "Partager"}
                                </Button>
                            </div>

                            {/* Font Size Controls */}
                            <div className="flex items-center gap-1 border rounded-lg p-1 bg-muted/20">
                                {(["sm", "md", "lg"] as const).map((size) => (
                                    <Button
                                        key={size}
                                        variant="ghost"
                                        size="sm"
                                        className={cn("h-8 w-8 p-0 rounded-md", fontSize === size && "bg-background shadow-sm")}
                                        onClick={() => setFontSize(size)}
                                        title={size === "sm" ? "Petite police" : size === "md" ? "Police moyenne" : "Grande police"}
                                    >
                                        <Type className={size === "sm" ? "h-3 w-3" : size === "md" ? "h-4 w-4" : "h-5 w-5"} />
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content area */}
                <div className="container px-4 md:px-6 py-8">
                    <main id="main-content" className="max-w-4xl mx-auto">
                        {/* Resume */}
                        {livre.resume && (
                            <div className="mb-6 border rounded-lg p-5 bg-muted/30">
                                <h2 className="font-semibold mb-2">Resume</h2>
                                <p className="text-sm text-muted-foreground whitespace-pre-line">{livre.resume}</p>
                            </div>
                        )}

                        {/* Chapters */}
                        {articles.length > 0 ? (
                            <div>
                                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-lg p-3.5 mb-6 text-sm text-blue-800 dark:text-blue-300 flex items-center">
                                    <BookOpen className="h-4 w-4 mr-2 flex-shrink-0" />
                                    Cliquez sur les titres pour derouler le contenu. {articles.length} chapitre{articles.length > 1 ? "s" : ""} au total.
                                </div>
                                <CodeViewer articles={articles} fontSize={fontSize} searchQuery={searchQuery} />
                            </div>
                        ) : (
                            <div className="text-center py-16 text-muted-foreground">
                                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Aucun chapitre disponible pour ce livre.</p>
                                <p className="text-sm mt-1">Le contenu n&apos;a peut-etre pas encore ete extrait.</p>
                                {livre.fichierPdf && (
                                    <a href={getLivreExportPdfUrl(livre.id)} target="_blank" rel="noopener noreferrer">
                                        <Button variant="outline" className="mt-4 gap-2">
                                            <Download className="h-4 w-4" /> Telecharger le PDF
                                        </Button>
                                    </a>
                                )}
                            </div>
                        )}
                    </main>
                </div>
            </div>
            <Footer />
        </div>
    );
}
