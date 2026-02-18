"use client";

import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { Button } from "@/components/ui/Button";
import { useLoi, useRelations, useExport } from "@/lib/hooks";
import { NATURE_LABELS, ETAT_LABELS, Texte } from "@/lib/api";
import {
    ChevronRight, FileText, Share2, Printer, Calendar, AlertCircle, ArrowLeft,
    Loader2, Link2, FileDown, Type, Scale, BookOpen, Gavel, FileCheck,
    Clock, User, Hash, BookMarked, ExternalLink
} from "lucide-react";
import Link from "next/link";
import { CodeViewer } from "@/components/CodeViewer";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
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

const NATURE_ICONS: Record<string, React.ReactNode> = {
    LOI: <Scale className="h-6 w-6" />,
    LOI_ORGANIQUE: <Scale className="h-6 w-6" />,
    LOI_CONSTITUTIONNELLE: <BookOpen className="h-6 w-6" />,
    ORDONNANCE: <Gavel className="h-6 w-6" />,
    DECRET: <FileCheck className="h-6 w-6" />,
    CODE: <BookOpen className="h-6 w-6" />,
    ARRETE: <FileText className="h-6 w-6" />,
};

const ETAT_STYLES: Record<string, string> = {
    VIGUEUR: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    VIGUEUR_DIFF: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    MODIFIE: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    ABROGE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    ABROGE_DIFF: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    PERIME: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

const RELATION_TYPES = [
    { key: "abroge", label: "Abroge", color: "text-red-600 dark:text-red-400", dir: "source" },
    { key: "modifie", label: "Modifie", color: "text-amber-600 dark:text-amber-400", dir: "source" },
    { key: "complete", label: "Complète", color: "text-blue-600 dark:text-blue-400", dir: "source" },
    { key: "cite", label: "Cite", color: "text-muted-foreground", dir: "source" },
    { key: "applique", label: "Applique", color: "text-purple-600 dark:text-purple-400", dir: "source" },
    { key: "ratifie", label: "Ratifie", color: "text-teal-600 dark:text-teal-400", dir: "source" },
    { key: "abrogePar", label: "Abrogé par", color: "text-red-600 dark:text-red-400", dir: "cible" },
    { key: "modifiePar", label: "Modifié par", color: "text-amber-600 dark:text-amber-400", dir: "cible" },
    { key: "completePar", label: "Complété par", color: "text-blue-600 dark:text-blue-400", dir: "cible" },
    { key: "citePar", label: "Cité par", color: "text-muted-foreground", dir: "cible" },
    { key: "appliquePar", label: "Appliqué par", color: "text-purple-600 dark:text-purple-400", dir: "cible" },
    { key: "ratifiePar", label: "Ratifié par", color: "text-teal-600 dark:text-teal-400", dir: "cible" },
] as const;

export function LawDetailsClient({ id, initialData }: { id: string; initialData?: Texte }) {
    const { data: texte, isLoading, isError, error } = useLoi(id, initialData);
    const { data: relationsData } = useRelations(id);
    const exportMutation = useExport();
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('sm');
    const [copied, setCopied] = useState(false);
    const [activeArticle, setActiveArticle] = useState<string | null>(null);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    // Close export menu on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
                setShowExportMenu(false);
            }
        }
        if (showExportMenu) {
            document.addEventListener("mousedown", handleClick);
            return () => document.removeEventListener("mousedown", handleClick);
        }
    }, [showExportMenu]);

    // Track active article on scroll
    useEffect(() => {
        if (!texte?.articles?.length) return;
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setActiveArticle(entry.target.id);
                    }
                }
            },
            { rootMargin: "-100px 0px -60% 0px", threshold: 0 }
        );
        texte.articles.forEach((a) => {
            const el = document.getElementById(`article-${a.numero}`);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, [texte?.articles]);

    const handleExport = (format: 'pdf' | 'docx' | 'json' | 'html') => {
        exportMutation.mutate({ texteId: id, format });
        setShowExportMenu(false);
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
    const natureLabel = NATURE_LABELS[texte.nature] || texte.nature;
    const etatLabel = ETAT_LABELS[texte.etat] || texte.etat;
    const etatStyle = ETAT_STYLES[texte.etat] || ETAT_STYLES.VIGUEUR;

    // Collect all non-empty relations
    const activeRelations = relationsData
        ? RELATION_TYPES.filter(rt => {
            const rels = relationsData.relations[rt.key as keyof typeof relationsData.relations];
            return rels && rels.length > 0;
        })
        : [];

    // SEO Structured Data (JSON-LD)
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Legislation",
        "name": texte.titre,
        "legislationType": natureLabel,
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
            <div className="flex-1">
                {/* Hero banner */}
                <div className="bg-gradient-to-b from-accent/30 to-background border-b">
                    <div className="container px-4 md:px-6 py-8">
                        {/* Breadcrumb */}
                        <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground mb-6">
                            <Link href="/lois" className="hover:text-primary transition-colors">Textes juridiques</Link>
                            <ChevronRight className="h-3.5 w-3.5" />
                            <span>{natureLabel}</span>
                            {texte.numero && (
                                <>
                                    <ChevronRight className="h-3.5 w-3.5" />
                                    <span className="text-foreground">{texte.numero}</span>
                                </>
                            )}
                        </nav>

                        <div className="flex items-start gap-5">
                            {/* Nature icon */}
                            <div className="hidden sm:flex p-4 bg-primary/10 rounded-2xl text-primary flex-shrink-0">
                                {NATURE_ICONS[texte.nature] || <FileText className="h-6 w-6" />}
                            </div>

                            <div className="flex-1 min-w-0">
                                {/* Badges */}
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                    <span className="text-xs font-semibold px-2.5 py-1 bg-primary/10 text-primary rounded-full">
                                        {natureLabel}
                                    </span>
                                    <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", etatStyle)}>
                                        {etatLabel}
                                    </span>
                                    {texte.sousCategorie && (
                                        <span className="text-xs font-medium px-2.5 py-1 bg-muted rounded-full">
                                            {texte.sousCategorie}
                                        </span>
                                    )}
                                </div>

                                {/* Title */}
                                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-4">
                                    {texte.titre}
                                </h1>
                                {texte.titreComplet && texte.titreComplet !== texte.titre && (
                                    <p className="text-muted-foreground text-base md:text-lg mb-4">{texte.titreComplet}</p>
                                )}

                                {/* Metadata row */}
                                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                                    {texte.numero && (
                                        <span className="flex items-center gap-1.5">
                                            <Hash className="h-3.5 w-3.5" /> {texte.numero}
                                        </span>
                                    )}
                                    {texte.dateSignature && (
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5" /> Signé le {formatDate(texte.dateSignature)}
                                        </span>
                                    )}
                                    {texte.datePublication && (
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5" /> Publié le {formatDate(texte.datePublication)}
                                        </span>
                                    )}
                                    {texte.signataires && (
                                        <span className="flex items-center gap-1.5">
                                            <User className="h-3.5 w-3.5" /> {texte.signataires}
                                        </span>
                                    )}
                                    {texte.sourceJO && (
                                        <span className="flex items-center gap-1.5">
                                            <BookMarked className="h-3.5 w-3.5" /> {texte.sourceJO}
                                        </span>
                                    )}
                                    {articles.length > 0 && (
                                        <span className="flex items-center gap-1.5">
                                            <FileText className="h-3.5 w-3.5" /> {articles.length} article{articles.length > 1 ? "s" : ""}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-5 border-t border-border/50">
                            <div className="flex items-center gap-2">
                                {/* Export */}
                                <div className="relative" ref={exportMenuRef}>
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
                                        <div className="absolute top-full left-0 mt-1 w-44 bg-card border rounded-lg shadow-lg z-50 py-1 animate-in fade-in zoom-in-95 duration-150">
                                            {[
                                                { format: "pdf" as const, label: "PDF", icon: <FileText className="h-4 w-4" /> },
                                                { format: "docx" as const, label: "Word (DOCX)", icon: <FileText className="h-4 w-4" /> },
                                                { format: "html" as const, label: "HTML", icon: <ExternalLink className="h-4 w-4" /> },
                                                { format: "json" as const, label: "JSON", icon: <FileText className="h-4 w-4" /> },
                                            ].map(({ format, label, icon }) => (
                                                <button
                                                    key={format}
                                                    className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex items-center gap-2 transition-colors"
                                                    onClick={() => handleExport(format)}
                                                >
                                                    {icon} {label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <Button variant="outline" size="sm" onClick={() => window.print()}>
                                    <Printer className="mr-2 h-4 w-4" /> Imprimer
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleShare}>
                                    <Share2 className="mr-2 h-4 w-4" />
                                    {copied ? "Copié !" : "Partager"}
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
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Table of Contents Sidebar */}
                        {articles.length > 0 && (
                            <aside className="w-full lg:w-72 xl:w-80 flex-shrink-0 order-2 lg:order-1">
                                <div className="sticky top-20 border rounded-lg bg-card max-h-[calc(100vh-6rem)] overflow-hidden flex flex-col">
                                    <div className="p-4 border-b bg-muted/30">
                                        <h2 className="font-semibold text-sm flex items-center">
                                            <FileText className="mr-2 h-4 w-4 text-primary" />
                                            Table des matières
                                        </h2>
                                    </div>
                                    <nav className="p-3 overflow-y-auto flex-1 space-y-0.5">
                                        {articles.map((article) => (
                                            <a
                                                key={article.id}
                                                href={`#article-${article.numero}`}
                                                className={cn(
                                                    "block text-sm py-1.5 px-2 rounded-md transition-colors",
                                                    activeArticle === `article-${article.numero}`
                                                        ? "bg-primary/10 text-primary font-medium"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                                )}
                                            >
                                                Art. {article.numero}
                                            </a>
                                        ))}
                                    </nav>
                                </div>
                            </aside>
                        )}

                        {/* Main Content */}
                        <main className={cn("flex-1 min-w-0 order-1 lg:order-2", !articles.length && "max-w-4xl mx-auto")}>
                            {/* Visas */}
                            {texte.visas && (
                                <details className="mb-6 border rounded-lg">
                                    <summary className="px-4 py-3 cursor-pointer font-medium text-sm hover:bg-muted/50 transition-colors rounded-lg">
                                        Visas
                                    </summary>
                                    <div className="px-4 pb-4 text-sm text-muted-foreground whitespace-pre-line">
                                        {texte.visas}
                                    </div>
                                </details>
                            )}

                            {/* Articles */}
                            {articles.length > 0 ? (
                                <div>
                                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-lg p-3.5 mb-6 text-sm text-blue-800 dark:text-blue-300 flex items-center">
                                        <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                                        Cliquez sur les titres pour dérouler le contenu. {articles.length} article{articles.length > 1 ? "s" : ""} au total.
                                    </div>
                                    <CodeViewer articles={articles} fontSize={fontSize} />
                                </div>
                            ) : (
                                <div className="text-center py-16 text-muted-foreground">
                                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Aucun article disponible pour ce texte.</p>
                                    <p className="text-sm mt-1">Le contenu n&apos;a peut-être pas encore été extrait.</p>
                                </div>
                            )}

                            {/* Relations */}
                            {relationsData && relationsData.counts.total > 0 && (
                                <div className="mt-12 border-t pt-8">
                                    <h2 className="text-xl font-bold mb-6 flex items-center">
                                        <Link2 className="mr-2 h-5 w-5 text-primary" />
                                        Relations avec d&apos;autres textes
                                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                                            ({relationsData.counts.total})
                                        </span>
                                    </h2>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        {/* Ce texte agit sur */}
                                        {relationsData.counts.source > 0 && (
                                            <div className="border rounded-lg overflow-hidden">
                                                <div className="px-4 py-3 bg-muted/30 border-b">
                                                    <h3 className="font-semibold text-sm">Ce texte agit sur</h3>
                                                </div>
                                                <ul className="divide-y">
                                                    {activeRelations
                                                        .filter(rt => rt.dir === "source")
                                                        .flatMap(rt => {
                                                            const rels = relationsData.relations[rt.key as keyof typeof relationsData.relations];
                                                            return rels.map(rel => (
                                                                <li key={rel.id} className="px-4 py-3 flex items-start gap-2 text-sm hover:bg-muted/30 transition-colors">
                                                                    <span className={cn("font-medium flex-shrink-0 mt-0.5", rt.color)}>
                                                                        {rt.label}
                                                                    </span>
                                                                    <Link href={`/lois/${rel.texteCible?.id}`} className="text-primary hover:underline line-clamp-2">
                                                                        {rel.texteCible?.titre}
                                                                    </Link>
                                                                </li>
                                                            ));
                                                        })}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Ce texte est affecté par */}
                                        {relationsData.counts.cible > 0 && (
                                            <div className="border rounded-lg overflow-hidden">
                                                <div className="px-4 py-3 bg-muted/30 border-b">
                                                    <h3 className="font-semibold text-sm">Ce texte est affecté par</h3>
                                                </div>
                                                <ul className="divide-y">
                                                    {activeRelations
                                                        .filter(rt => rt.dir === "cible")
                                                        .flatMap(rt => {
                                                            const rels = relationsData.relations[rt.key as keyof typeof relationsData.relations];
                                                            return rels.map(rel => (
                                                                <li key={rel.id} className="px-4 py-3 flex items-start gap-2 text-sm hover:bg-muted/30 transition-colors">
                                                                    <span className={cn("font-medium flex-shrink-0 mt-0.5", rt.color)}>
                                                                        {rt.label}
                                                                    </span>
                                                                    <Link href={`/lois/${rel.texteSource?.id}`} className="text-primary hover:underline line-clamp-2">
                                                                        {rel.texteSource?.titre}
                                                                    </Link>
                                                                </li>
                                                            ));
                                                        })}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </main>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
