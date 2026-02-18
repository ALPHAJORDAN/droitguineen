"use client";

import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { Button } from "@/components/ui/Button";
import { useLoi, useRelations, useExport } from "@/lib/hooks";
import { NATURE_LABELS, ETAT_LABELS, Texte } from "@/lib/api";
import {
    ChevronRight, FileText, Share2, Printer, Calendar, AlertCircle, ArrowLeft,
    Loader2, FileDown, Type, Scale, BookOpen, Gavel, FileCheck,
    Clock, User, Hash, BookMarked, ExternalLink, Pencil, Download,
} from "lucide-react";
import Link from "next/link";
import { CodeViewer } from "@/components/CodeViewer";
import { HierarchicalTOC } from "@/components/law-detail/HierarchicalTOC";
import { SearchBar } from "@/components/law-detail/SearchBar";
import { MetadataPanel } from "@/components/law-detail/MetadataPanel";
import { RelationsPanel } from "@/components/law-detail/RelationsPanel";
import { EditModal } from "@/components/admin/EditModal";
import { ToastProvider } from "@/components/admin/Toast";
import { useAuth } from "@/lib/auth";
import { useState, useEffect, useRef, useCallback } from "react";
import { cn, formatDate, ETAT_STYLES } from "@/lib/utils";
import Script from "next/script";

const NATURE_ICONS: Record<string, React.ReactNode> = {
    LOI: <Scale className="h-6 w-6" />,
    LOI_ORGANIQUE: <Scale className="h-6 w-6" />,
    LOI_CONSTITUTIONNELLE: <BookOpen className="h-6 w-6" />,
    ORDONNANCE: <Gavel className="h-6 w-6" />,
    DECRET: <FileCheck className="h-6 w-6" />,
    CODE: <BookOpen className="h-6 w-6" />,
    ARRETE: <FileText className="h-6 w-6" />,
};

export function LawDetailsClient({ id, initialData }: { id: string; initialData?: Texte }) {
    const { data: texte, isLoading, isError, error } = useLoi(id, initialData);
    const { data: relationsData } = useRelations(id);
    const { user } = useAuth();
    const exportMutation = useExport();
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('sm');
    const [copied, setCopied] = useState(false);
    const [activeArticle, setActiveArticle] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    const isAdmin = user?.role === "ADMIN" || user?.role === "EDITOR";
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

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

    // Track active article on scroll with DOM-direct class toggling for performance
    useEffect(() => {
        if (!texte?.articles?.length) return;
        let currentActive: Element | null = null;

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        // Direct DOM manipulation to avoid re-rendering all articles
                        currentActive?.classList.remove('article-active');
                        entry.target.classList.add('article-active');
                        currentActive = entry.target;
                        // Update React state for TOC sync
                        setActiveArticle(entry.target.id);
                        // Auto-scroll the TOC to keep active item visible
                        const tocLink = document.querySelector(`[data-toc-target="${entry.target.id}"]`);
                        if (tocLink) {
                            tocLink.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }
                    }
                }
            },
            { rootMargin: "-100px 0px -60% 0px", threshold: 0 }
        );
        texte.articles.forEach((a) => {
            const el = document.getElementById(`article-${a.numero}`);
            if (el) observer.observe(el);
        });
        return () => {
            currentActive?.classList.remove('article-active');
            observer.disconnect();
        };
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

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
    }, []);

    // Count articles matching search
    const articles = texte?.articles || [];
    const searchResultCount = searchQuery.trim()
        ? articles.filter(a =>
            a.contenu.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.numero.toLowerCase().includes(searchQuery.toLowerCase())
        ).length
        : 0;

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
                                {error instanceof Error ? error.message : "Impossible de charger ce texte. Il n'existe peut-etre pas."}
                            </p>
                        </div>
                    </div>
                    <Link href="/lois" className="inline-flex items-center gap-2 mt-6 text-primary hover:underline">
                        <ArrowLeft className="h-4 w-4" />
                        Retour a la liste
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    const natureLabel = NATURE_LABELS[texte.nature] || texte.nature;
    const etatLabel = ETAT_LABELS[texte.etat] || texte.etat;
    const etatStyle = ETAT_STYLES[texte.etat] || ETAT_STYLES.VIGUEUR;

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
            <ReadingProgress />
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
                            <Link
                                href={`/lois?nature=${texte.nature}`}
                                className="hover:text-primary transition-colors"
                            >
                                {natureLabel}
                            </Link>
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
                                            <Calendar className="h-3.5 w-3.5" /> Signe le {formatDate(texte.dateSignature)}
                                        </span>
                                    )}
                                    {texte.datePublication && (
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5" /> Publie le {formatDate(texte.datePublication)}
                                        </span>
                                    )}
                                    {texte.dateEntreeVigueur && (
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5" /> En vigueur le {formatDate(texte.dateEntreeVigueur)}
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
                                    {copied ? "Copie !" : "Partager"}
                                </Button>
                                {texte.fichierPdf && (
                                    <a href={`${API_URL}/${texte.fichierPdf}`} target="_blank" rel="noopener noreferrer">
                                        <Button variant="outline" size="sm">
                                            <Download className="mr-2 h-4 w-4" /> PDF
                                        </Button>
                                    </a>
                                )}
                                {isAdmin && (
                                    <Button variant="outline" size="sm" onClick={() => setEditingId(id)}>
                                        <Pencil className="mr-2 h-4 w-4" /> Modifier
                                    </Button>
                                )}
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
                    <div className="flex gap-8">
                        {/* Table of Contents Sidebar (desktop) + Mobile floating button */}
                        {articles.length > 0 && (
                            <HierarchicalTOC
                                sections={texte.sections}
                                articles={articles}
                                activeArticle={activeArticle}
                            />
                        )}

                        {/* Main Content */}
                        <main className={cn("flex-1 min-w-0", !articles.length && "max-w-4xl mx-auto")}>
                            {/* Search bar */}
                            {articles.length > 0 && (
                                <div className="mb-6">
                                    <SearchBar onSearch={handleSearch} resultCount={searchResultCount} />
                                </div>
                            )}

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

                            {/* Metadata Panel */}
                            <div className="mb-6">
                                <MetadataPanel texte={texte} />
                            </div>

                            {/* Articles */}
                            {articles.length > 0 ? (
                                <div>
                                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-lg p-3.5 mb-6 text-sm text-blue-800 dark:text-blue-300 flex items-center">
                                        <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                                        Cliquez sur les titres pour derouler le contenu. {articles.length} article{articles.length > 1 ? "s" : ""} au total.
                                    </div>
                                    <CodeViewer articles={articles} fontSize={fontSize} searchQuery={searchQuery} />
                                </div>
                            ) : (
                                <div className="text-center py-16 text-muted-foreground">
                                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Aucun article disponible pour ce texte.</p>
                                    <p className="text-sm mt-1">Le contenu n&apos;a peut-etre pas encore ete extrait.</p>
                                </div>
                            )}

                            {/* Relations */}
                            {relationsData && relationsData.counts.total > 0 && (
                                <RelationsPanel relationsData={relationsData} />
                            )}
                        </main>
                    </div>
                </div>
            </div>
            <Footer />

            {/* Edit Modal */}
            {editingId && (
                <ToastProvider>
                    <EditModal texteId={editingId} onClose={() => setEditingId(null)} />
                </ToastProvider>
            )}
        </div>
    );
}

function ReadingProgress() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const scrollTop = window.scrollY;
                    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                    setProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0);
                    ticking = false;
                });
                ticking = true;
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (progress <= 0) return null;

    return <div className="reading-progress" style={{ width: `${progress}%` }} />;
}
