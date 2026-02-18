"use client";

import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { Button } from "@/components/ui/Button";
import { useLoi, useRelations, useExport } from "@/lib/hooks";
import { NATURE_LABELS, Texte } from "@/lib/api";
import { ChevronRight, FileText, Share2, Printer, Calendar, AlertCircle, ArrowLeft, Loader2, Link2, FileDown, Type } from "lucide-react";
import Link from "next/link";
import { CodeViewer } from "@/components/CodeViewer";
import { useState } from "react";
import Script from "next/script";

function formatDate(dateString?: string): string {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

export function LawDetailsClient({ id, initialData }: { id: string; initialData?: Texte }) {
    const { data: texte, isLoading, isError, error } = useLoi(id, initialData);
    const { data: relationsData } = useRelations(id);
    const exportMutation = useExport();
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('sm');

    const handleExport = (format: 'pdf' | 'docx' | 'json' | 'html') => {
        exportMutation.mutate({ texteId: id, format });
        setShowExportMenu(false);
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen flex-col">
                <Header />
                <div className="flex-1 container py-8 px-4 md:px-6">
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2 text-muted-foreground">Chargement du texte...</span>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (isError || !texte) {
        return (
            <div className="flex min-h-screen flex-col">
                <Header />
                <div className="flex-1 container py-8 px-4 md:px-6">
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 flex items-center gap-4">
                        <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0" />
                        <div>
                            <h2 className="font-semibold text-destructive">Erreur</h2>
                            <p className="text-muted-foreground">
                                {error instanceof Error ? error.message : "Impossible de charger ce texte. Il n'existe peut-être pas."}
                            </p>
                        </div>
                    </div>
                    <Link href="/lois" className="inline-flex items-center gap-2 mt-6 text-primary hover:underline">
                        <ArrowLeft className="h-4 w-4" />
                        Retour à la liste
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    const articles = texte.articles || [];

    // SEO Structured Data (JSON-LD)
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Legislation",
        "name": texte.titre,
        "legislationType": NATURE_LABELS[texte.nature] || texte.nature,
        "legislationIdentifier": texte.numero,
        "datePublished": texte.datePublication,
        "legislationJurisdiction": "GN",
        "about": texte.titre,
    };

    return (
        <div className="flex min-h-screen flex-col">
            <Script
                id="legislation-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Header />
            <div className="flex-1 container py-8 px-4 md:px-6">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Table of Contents Sidebar */}
                    <aside className="w-full lg:w-80 flex-shrink-0">
                        <div className="sticky top-24 border rounded-lg p-4 bg-muted/30 max-h-[calc(100vh-8rem)] overflow-y-auto">
                            <h2 className="font-bold text-lg mb-4 flex items-center">
                                <FileText className="mr-2 h-5 w-5" />
                                Table des matières
                            </h2>
                            <nav className="space-y-1">
                                {articles.map((article) => (
                                    <a
                                        key={article.id}
                                        href={`#article-${article.numero}`}
                                        className="block text-sm text-muted-foreground hover:text-primary py-1 pl-2 border-l-2 border-transparent hover:border-primary transition-colors"
                                    >
                                        Article {article.numero}
                                    </a>
                                ))}
                            </nav>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 min-w-0">
                        <div className="mb-8 border-b pb-6">
                            <div className="flex flex-wrap items-center gap-2 mb-4 text-sm text-muted-foreground">
                                <Link href="/lois" className="hover:text-primary">Lois</Link>
                                <ChevronRight className="h-4 w-4" />
                                <span>{NATURE_LABELS[texte.nature] || texte.nature}</span>
                                {texte.numero && (
                                    <>
                                        <ChevronRight className="h-4 w-4" />
                                        <span>{texte.numero}</span>
                                    </>
                                )}
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold mb-4 text-primary">
                                {texte.titre}
                            </h1>

                            {/* Metadata */}
                            <div className="flex flex-wrap gap-4 mb-4 text-sm text-muted-foreground">
                                {texte.datePublication && (
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        Publié le {formatDate(texte.datePublication)}
                                    </span>
                                )}
                                {texte.sourceJO && (
                                    <span>{texte.sourceJO}</span>
                                )}
                            </div>

                            {/* Status badge */}
                            {texte.etat && texte.etat !== "VIGUEUR" && (
                                <div className="mb-4">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                        {texte.etat === "ABROGE" ? "Texte abrogé" : texte.etat}
                                    </span>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-4 relative items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowExportMenu(!showExportMenu)}
                                            disabled={exportMutation.isPending}
                                        >
                                            {exportMutation.isPending ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <FileDown className="mr-2 h-4 w-4" />
                                            )}
                                            Exporter
                                        </Button>
                                        {showExportMenu && (
                                            <div className="absolute top-full left-0 mt-1 w-48 bg-background border rounded-md shadow-lg z-50">
                                                <button
                                                    className="w-full text-left px-4 py-2 hover:bg-muted text-sm"
                                                    onClick={() => handleExport('pdf')}
                                                >
                                                    📄 PDF
                                                </button>
                                                <button
                                                    className="w-full text-left px-4 py-2 hover:bg-muted text-sm"
                                                    onClick={() => handleExport('docx')}
                                                >
                                                    📝 Word (DOCX)
                                                </button>
                                                <button
                                                    className="w-full text-left px-4 py-2 hover:bg-muted text-sm"
                                                    onClick={() => handleExport('html')}
                                                >
                                                    🌐 HTML
                                                </button>
                                                <button
                                                    className="w-full text-left px-4 py-2 hover:bg-muted text-sm"
                                                    onClick={() => handleExport('json')}
                                                >
                                                    🔧 JSON
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => window.print()}>
                                        <Printer className="mr-2 h-4 w-4" /> Imprimer
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => {
                                        navigator.clipboard.writeText(window.location.href);
                                        alert("Lien copié !");
                                    }}>
                                        <Share2 className="mr-2 h-4 w-4" /> Partager
                                    </Button>
                                </div>

                                {/* Font Size Controls */}
                                <div className="flex items-center border rounded-md p-1 bg-muted/20">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`h-8 w-8 p-0 ${fontSize === 'sm' ? 'bg-background shadow-sm' : ''}`}
                                        onClick={() => setFontSize('sm')}
                                        title="Petite police"
                                    >
                                        <Type className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`h-8 w-8 p-0 ${fontSize === 'md' ? 'bg-background shadow-sm' : ''}`}
                                        onClick={() => setFontSize('md')}
                                        title="Police moyenne"
                                    >
                                        <Type className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`h-8 w-8 p-0 ${fontSize === 'lg' ? 'bg-background shadow-sm' : ''}`}
                                        onClick={() => setFontSize('lg')}
                                        title="Grande police"
                                    >
                                        <Type className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Content: Use CodeViewer for all texts with articles */}
                        <div className="space-y-8">
                            {articles.length > 0 ? (
                                <div className="mt-8">
                                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-md p-4 mb-6 text-sm text-blue-800 dark:text-blue-300">
                                        <p className="flex items-center">
                                            <AlertCircle className="h-4 w-4 mr-2" />
                                            Cliquez sur les titres pour dérouler le contenu. {articles.length} articles au total.
                                        </p>
                                    </div>
                                    <CodeViewer articles={articles} fontSize={fontSize} />
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-center py-8">
                                    Aucun article disponible pour ce texte.
                                </p>
                            )}
                        </div>

                        {/* Relations entre textes */}
                        {relationsData && relationsData.counts.total > 0 && (
                            <div className="mt-12 border-t pt-8">
                                <h2 className="text-xl font-bold mb-6 flex items-center">
                                    <Link2 className="mr-2 h-5 w-5" />
                                    Relations avec d&apos;autres textes
                                </h2>

                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Ce texte modifie/abroge */}
                                    {relationsData.counts.source > 0 && (
                                        <div className="border rounded-lg p-4">
                                            <h3 className="font-semibold mb-4 text-primary">Ce texte :</h3>
                                            <ul className="space-y-2">
                                                {relationsData.relations.abroge.map(rel => (
                                                    <li key={rel.id} className="flex items-start gap-2 text-sm">
                                                        <span className="text-red-600 font-medium">Abroge :</span>
                                                        <Link href={`/lois/${rel.texteCible?.id}`} className="text-primary hover:underline">
                                                            {rel.texteCible?.titre}
                                                        </Link>
                                                    </li>
                                                ))}
                                                {relationsData.relations.modifie.map(rel => (
                                                    <li key={rel.id} className="flex items-start gap-2 text-sm">
                                                        <span className="text-amber-600 font-medium">Modifie :</span>
                                                        <Link href={`/lois/${rel.texteCible?.id}`} className="text-primary hover:underline">
                                                            {rel.texteCible?.titre}
                                                        </Link>
                                                    </li>
                                                ))}
                                                {relationsData.relations.complete.map(rel => (
                                                    <li key={rel.id} className="flex items-start gap-2 text-sm">
                                                        <span className="text-blue-600 font-medium">Complète :</span>
                                                        <Link href={`/lois/${rel.texteCible?.id}`} className="text-primary hover:underline">
                                                            {rel.texteCible?.titre}
                                                        </Link>
                                                    </li>
                                                ))}
                                                {relationsData.relations.cite.map(rel => (
                                                    <li key={rel.id} className="flex items-start gap-2 text-sm">
                                                        <span className="text-gray-600 font-medium">Cite :</span>
                                                        <Link href={`/lois/${rel.texteCible?.id}`} className="text-primary hover:underline">
                                                            {rel.texteCible?.titre}
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Ce texte est modifié/abrogé par */}
                                    {relationsData.counts.cible > 0 && (
                                        <div className="border rounded-lg p-4">
                                            <h3 className="font-semibold mb-4 text-primary">Ce texte est :</h3>
                                            <ul className="space-y-2">
                                                {relationsData.relations.abrogePar.map(rel => (
                                                    <li key={rel.id} className="flex items-start gap-2 text-sm">
                                                        <span className="text-red-600 font-medium">Abrogé par :</span>
                                                        <Link href={`/lois/${rel.texteSource?.id}`} className="text-primary hover:underline">
                                                            {rel.texteSource?.titre}
                                                        </Link>
                                                    </li>
                                                ))}
                                                {relationsData.relations.modifiePar.map(rel => (
                                                    <li key={rel.id} className="flex items-start gap-2 text-sm">
                                                        <span className="text-amber-600 font-medium">Modifié par :</span>
                                                        <Link href={`/lois/${rel.texteSource?.id}`} className="text-primary hover:underline">
                                                            {rel.texteSource?.titre}
                                                        </Link>
                                                    </li>
                                                ))}
                                                {relationsData.relations.completePar.map(rel => (
                                                    <li key={rel.id} className="flex items-start gap-2 text-sm">
                                                        <span className="text-blue-600 font-medium">Complété par :</span>
                                                        <Link href={`/lois/${rel.texteSource?.id}`} className="text-primary hover:underline">
                                                            {rel.texteSource?.titre}
                                                        </Link>
                                                    </li>
                                                ))}
                                                {relationsData.relations.citePar.map(rel => (
                                                    <li key={rel.id} className="flex items-start gap-2 text-sm">
                                                        <span className="text-gray-600 font-medium">Cité par :</span>
                                                        <Link href={`/lois/${rel.texteSource?.id}`} className="text-primary hover:underline">
                                                            {rel.texteSource?.titre}
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
            <Footer />
        </div>
    );
}
