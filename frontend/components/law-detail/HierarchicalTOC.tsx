"use client";

import { Section, Article } from "@/lib/api";
import { ChevronRight, List, FileText } from "lucide-react";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/Sheet";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface HierarchicalTOCProps {
    sections?: Section[];
    articles?: Article[];
    activeArticle: string | null;
}

export function HierarchicalTOC({ sections, articles = [], activeArticle }: HierarchicalTOCProps) {
    const [mobileOpen, setMobileOpen] = useState(false);

    const hasSections = sections && sections.length > 0;

    const closeMobile = useCallback(() => setMobileOpen(false), []);

    return (
        <>
            {/* Desktop sidebar */}
            <aside className="hidden lg:block w-72 xl:w-80 flex-shrink-0">
                <div className="sticky top-20 border rounded-lg bg-card max-h-[calc(100vh-6rem)] overflow-hidden flex flex-col">
                    <div className="p-4 border-b bg-muted/30">
                        <h2 className="font-semibold text-sm flex items-center">
                            <FileText className="mr-2 h-4 w-4 text-primary" />
                            Table des matieres
                        </h2>
                    </div>
                    <nav className="p-3 overflow-y-auto flex-1">
                        {hasSections ? (
                            <SectionTree sections={sections} activeArticle={activeArticle} />
                        ) : (
                            <FlatArticleList articles={articles} activeArticle={activeArticle} />
                        )}
                    </nav>
                </div>
            </aside>

            {/* Mobile floating button + Sheet */}
            {(hasSections || articles.length > 0) && (
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetTrigger asChild>
                        <button
                            className="lg:hidden fixed bottom-6 right-6 z-40 bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:opacity-90 transition-opacity"
                            aria-label="Table des matieres"
                        >
                            <List className="h-5 w-5" />
                        </button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh] flex flex-col p-0 lg:hidden">
                        <VisuallyHidden>
                            <SheetTitle>Table des matieres</SheetTitle>
                            <SheetDescription>Navigation dans le document</SheetDescription>
                        </VisuallyHidden>
                        <div className="p-4 border-b flex items-center flex-shrink-0">
                            <h2 className="font-semibold text-sm flex items-center">
                                <FileText className="mr-2 h-4 w-4 text-primary" />
                                Table des matieres
                            </h2>
                        </div>
                        <nav className="p-3 overflow-y-auto flex-1">
                            {hasSections ? (
                                <SectionTree sections={sections} activeArticle={activeArticle} onNavigate={closeMobile} />
                            ) : (
                                <FlatArticleList articles={articles} activeArticle={activeArticle} onNavigate={closeMobile} />
                            )}
                        </nav>
                    </SheetContent>
                </Sheet>
            )}
        </>
    );
}

function FlatArticleList({
    articles,
    activeArticle,
    onNavigate,
}: {
    articles: Article[];
    activeArticle: string | null;
    onNavigate?: () => void;
}) {
    const handleClick = (e: React.MouseEvent, articleNumero: string) => {
        e.preventDefault();
        const el = document.getElementById(`article-${articleNumero}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            el.classList.add('article-flash');
            setTimeout(() => el.classList.remove('article-flash'), 1500);
        }
        onNavigate?.();
    };

    return (
        <div className="space-y-0.5">
            {articles.map((article) => (
                <button
                    key={article.id}
                    data-toc-target={`article-${article.numero}`}
                    onClick={(e) => handleClick(e, article.numero)}
                    className={cn(
                        "block w-full text-left text-sm py-1.5 px-3 rounded-md transition-all duration-200 relative",
                        activeArticle === `article-${article.numero}`
                            ? "toc-item-active bg-primary/8 text-primary font-medium pl-4"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                >
                    Art. {article.numero}
                </button>
            ))}
        </div>
    );
}

function SectionTree({
    sections,
    activeArticle,
    onNavigate,
    level = 0,
}: {
    sections: Section[];
    activeArticle: string | null;
    onNavigate?: () => void;
    level?: number;
}) {
    return (
        <div className={cn("space-y-0.5", level > 0 && "ml-3")}>
            {sections.map((section) => (
                <SectionNode
                    key={section.id}
                    section={section}
                    activeArticle={activeArticle}
                    onNavigate={onNavigate}
                    level={level}
                />
            ))}
        </div>
    );
}

function SectionNode({
    section,
    activeArticle,
    onNavigate,
    level,
}: {
    section: Section;
    activeArticle: string | null;
    onNavigate?: () => void;
    level: number;
}) {
    const [expanded, setExpanded] = useState(level <= 1);
    const hasChildren = section.enfants && section.enfants.length > 0;
    const hasArticles = section.articles && section.articles.length > 0;
    const hasContent = hasChildren || hasArticles;

    const articleCount = countArticles(section);

    // Find first article in this section for scroll target
    const firstArticle = hasArticles
        ? section.articles?.[0] ?? null
        : hasChildren
            ? findFirstArticle(section.enfants ?? [])
            : null;

    const handleClick = () => {
        if (hasContent) {
            setExpanded(!expanded);
        }
        if (firstArticle) {
            const el = document.getElementById(`article-${firstArticle.numero}`);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            onNavigate?.();
        }
    };

    // Determine label size by level
    const labelStyle = level === 0
        ? "font-semibold text-sm"
        : level === 1
            ? "font-medium text-sm"
            : "text-xs";

    return (
        <div>
            <button
                onClick={handleClick}
                className={cn(
                    "flex items-center gap-1 w-full text-left py-1.5 px-2 rounded-md transition-colors hover:bg-muted/50",
                    labelStyle,
                    "text-muted-foreground hover:text-foreground"
                )}
            >
                {hasContent ? (
                    <span className={cn(
                        "flex-shrink-0 transition-transform duration-200",
                        expanded && "rotate-90"
                    )}>
                        <ChevronRight className="h-3 w-3" />
                    </span>
                ) : (
                    <span className="w-3 flex-shrink-0" />
                )}
                <span className="flex-1 truncate">{section.titre}</span>
                {articleCount > 0 && (
                    <span className="text-[10px] text-muted-foreground/60 ml-1">
                        ({articleCount})
                    </span>
                )}
            </button>

            {expanded && hasChildren && (
                <SectionTree
                    sections={section.enfants ?? []}
                    activeArticle={activeArticle}
                    onNavigate={onNavigate}
                    level={level + 1}
                />
            )}

            {expanded && hasArticles && !hasChildren && (
                <div className="ml-6 space-y-0.5">
                    {(section.articles ?? []).map((article) => (
                        <button
                            key={article.id}
                            data-toc-target={`article-${article.numero}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                const el = document.getElementById(`article-${article.numero}`);
                                if (el) {
                                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    el.classList.add('article-flash');
                                    setTimeout(() => el.classList.remove('article-flash'), 1500);
                                }
                                onNavigate?.();
                            }}
                            className={cn(
                                "block w-full text-left text-xs py-1 px-3 rounded-md transition-all duration-200 relative",
                                activeArticle === `article-${article.numero}`
                                    ? "toc-item-active bg-primary/8 text-primary font-medium pl-4"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            Art. {article.numero}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function countArticles(section: Section): number {
    let count = section.articles?.length || 0;
    if (section.enfants) {
        for (const child of section.enfants) {
            count += countArticles(child);
        }
    }
    return count;
}

function findFirstArticle(sections: Section[]): Article | null {
    for (const section of sections) {
        if (section.articles && section.articles.length > 0) {
            return section.articles[0];
        }
        if (section.enfants) {
            const found = findFirstArticle(section.enfants);
            if (found) return found;
        }
    }
    return null;
}
