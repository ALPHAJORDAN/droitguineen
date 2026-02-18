"use client";

import { Article } from "@/lib/api";
import { ChevronRight, ChevronDown, ChevronUp, Link2 } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { cn, ETAT_STYLES } from "@/lib/utils";

interface CodeViewerProps {
    articles: Article[];
    fontSize?: 'sm' | 'md' | 'lg';
    searchQuery?: string;
}

interface SectionNode {
    id: string;
    titre: string;
    articles: Article[];
    children: Map<string, SectionNode>;
}

export function CodeViewer({ articles, fontSize = 'sm', searchQuery = '' }: CodeViewerProps) {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

    // Construire l'arborescence à partir des articles et leurs sections
    const tree = useMemo(() => {
        const root = new Map<string, SectionNode>();

        // Grouper les articles par section
        const articlesBySection = new Map<string, Article[]>();
        const sectionsById = new Map<string, { id: string; titre: string }>();

        articles.forEach(article => {
            if (article.section) {
                const sectionId = article.section.id;
                sectionsById.set(sectionId, article.section);

                if (!articlesBySection.has(sectionId)) {
                    articlesBySection.set(sectionId, []);
                }
                articlesBySection.get(sectionId)!.push(article);
            }
        });

        // Trier les sections par leur titre pour un affichage cohérent
        const sortedSections = Array.from(sectionsById.values()).sort((a, b) => {
            // Extraire le numéro ou l'ordre depuis le titre
            const getOrder = (titre: string) => {
                // Pour LIVRE I, TITRE II, CHAPITRE 3, etc.
                const match = titre.match(/(?:LIVRE|TITLE|TITRE|CHAPITRE|SECTION|PARAGRAPHE)\s*([IVXLCDM]+|\d+)/i);
                if (match) {
                    const num = match[1];
                    // Convertir les chiffres romains
                    if (/^[IVXLCDM]+$/i.test(num)) {
                        return romanToInt(num.toUpperCase());
                    }
                    return parseInt(num, 10);
                }
                return 999;
            };

            // Comparer par niveau hiérarchique d'abord
            const levelOrder = ['LIVRE', 'TITRE', 'CHAPITRE', 'SECTION', 'PARAGRAPHE', 'SOUS-SECTION'];
            const getLevelPriority = (titre: string) => {
                for (let i = 0; i < levelOrder.length; i++) {
                    if (titre.toUpperCase().startsWith(levelOrder[i])) return i;
                }
                return 99;
            };

            const levelA = getLevelPriority(a.titre);
            const levelB = getLevelPriority(b.titre);

            if (levelA !== levelB) return levelA - levelB;
            return getOrder(a.titre) - getOrder(b.titre);
        });

        // Créer les nœuds pour chaque section
        sortedSections.forEach(section => {
            const node: SectionNode = {
                id: section.id,
                titre: section.titre,
                articles: (articlesBySection.get(section.id) || []).sort((a, b) => a.ordre - b.ordre),
                children: new Map()
            };
            root.set(section.id, node);
        });

        return Array.from(root.values());
    }, [articles]);

    // Gérer l'expansion
    const allSectionIds = useMemo(() => new Set(tree.map(s => s.id)), [tree]);

    const toggleSection = (id: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const expandAll = () => setExpandedSections(new Set(allSectionIds));
    const collapseAll = () => setExpandedSections(new Set());

    // Initialisation - expand top-level sections by default
    useEffect(() => {
        const initial = new Set<string>();
        tree.forEach(s => {
            if (getLevelFromTitle(s.titre) <= 1) initial.add(s.id);
        });
        setExpandedSections(initial);
    }, [tree]);

    // Auto-expand sections containing search results
    useEffect(() => {
        if (!searchQuery.trim()) return;
        const query = searchQuery.toLowerCase();
        const matchingSections = new Set<string>();
        tree.forEach(s => {
            if (s.articles.some(a => a.contenu.toLowerCase().includes(query) || a.numero.toLowerCase().includes(query))) {
                matchingSections.add(s.id);
            }
        });
        if (matchingSections.size > 0) {
            setExpandedSections(prev => new Set([...prev, ...matchingSections]));
        }
    }, [searchQuery, tree]);

    // Grouper par niveau de section (LIVRE, TITRE, CHAPITRE, SECTION)
    const groupedByLevel = useMemo(() => {
        const groups: { niveau: string; sections: typeof tree }[] = [];
        const niveaux = ['LIVRE', 'TITRE', 'CHAPITRE', 'SECTION', 'PARAGRAPHE'];

        niveaux.forEach(niveau => {
            const matchingSections = tree.filter(s =>
                s.titre.toUpperCase().startsWith(niveau)
            );
            if (matchingSections.length > 0) {
                groups.push({ niveau, sections: matchingSections });
            }
        });

        // Ajouter les sections non catégorisées
        const categorized = new Set(groups.flatMap(g => g.sections.map(s => s.id)));
        const uncategorized = tree.filter(s => !categorized.has(s.id));
        if (uncategorized.length > 0) {
            groups.push({ niveau: 'AUTRES', sections: uncategorized });
        }

        return groups;
    }, [tree]);

    // Articles sans section
    const unsectionedArticles = useMemo(() => {
        return articles.filter(article => !article.section).sort((a, b) => {
            const numA = parseInt(a.numero.replace(/\D/g, ''), 10) || 0;
            const numB = parseInt(b.numero.replace(/\D/g, ''), 10) || 0;
            return numA - numB;
        });
    }, [articles]);

    // Si tous les articles sont sans section, les afficher directement
    if (tree.length === 0 && unsectionedArticles.length > 0) {
        return (
            <div className="space-y-3">
                {unsectionedArticles.map(article => (
                    <ArticleBlock key={article.id} article={article} fontSize={fontSize} searchQuery={searchQuery} />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Contrôles globaux */}
            {tree.length > 5 && (
                <div className="flex gap-2 sticky top-20 z-10 bg-background/80 backdrop-blur-sm py-2 border-b mb-4">
                    <Button variant="ghost" size="sm" onClick={expandAll} className="text-xs h-8">
                        <ChevronDown className="h-4 w-4 mr-1" /> Tout étendre
                    </Button>
                    <Button variant="ghost" size="sm" onClick={collapseAll} className="text-xs h-8">
                        <ChevronRight className="h-4 w-4 mr-1" /> Tout replier
                    </Button>
                </div>
            )}

            <div className="space-y-4">
                {groupedByLevel.map(group => (
                    <div key={group.niveau}>
                        {group.sections.map(section => (
                            <SectionBlock
                                key={section.id}
                                section={section}
                                level={getLevelFromTitle(section.titre)}
                                fontSize={fontSize || 'sm'}
                                isOpen={expandedSections.has(section.id)}
                                onToggle={() => toggleSection(section.id)}
                                searchQuery={searchQuery}
                            />
                        ))}
                    </div>
                ))}
            </div>
            {/* Afficher les articles sans section à la fin */}
            {unsectionedArticles.length > 0 && tree.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                    <h3 className="text-lg font-semibold mb-4">Articles hors sections</h3>
                    <div className="space-y-3">
                        {unsectionedArticles.map(article => (
                            <ArticleBlock key={article.id} article={article} fontSize={fontSize} searchQuery={searchQuery} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function getLevelFromTitle(titre: string): number {
    const upper = titre.toUpperCase();
    if (upper.startsWith('LIVRE')) return 0;
    if (upper.startsWith('TITRE')) return 1;
    if (upper.startsWith('CHAPITRE')) return 2;
    if (upper.startsWith('SOUS-SECTION')) return 4;
    if (upper.startsWith('SECTION')) return 3;
    if (upper.startsWith('PARAGRAPHE')) return 5;
    return 5;
}

function romanToInt(s: string): number {
    const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
    let result = 0;
    for (let i = 0; i < s.length; i++) {
        const curr = map[s[i]] || 0;
        const next = map[s[i + 1]] || 0;
        if (curr < next) {
            result -= curr;
        } else {
            result += curr;
        }
    }
    return result;
}

function SectionBlock({
    section,
    level,
    fontSize,
    isOpen,
    onToggle,
    searchQuery = '',
}: {
    section: SectionNode;
    level: number;
    fontSize: 'sm' | 'md' | 'lg';
    isOpen: boolean;
    onToggle: () => void;
    searchQuery?: string;
}) {
    const hasArticles = section.articles.length > 0;

    const headerStyles = [
        "text-xl font-bold text-primary", // LIVRE
        "text-lg font-semibold text-primary/90", // TITRE
        "text-base font-semibold text-foreground", // CHAPITRE
        "text-sm font-medium text-muted-foreground italic", // SECTION
        "text-sm text-muted-foreground", // PARAGRAPHE
        "text-sm text-muted-foreground", // Autres
    ];

    // Adjust header sizes based on font size preference
    const sizeMap: Record<string, Record<string, string>> = {
        md: { 'text-sm': 'text-base', 'text-base': 'text-lg', 'text-lg': 'text-xl', 'text-xl': 'text-2xl' },
        lg: { 'text-sm': 'text-lg', 'text-base': 'text-xl', 'text-lg': 'text-2xl', 'text-xl': 'text-3xl' },
    };
    const adjustedHeaderStyles = headerStyles.map(style => {
        const map = sizeMap[fontSize];
        if (!map) return style;
        return style.replace(/text-(sm|base|lg|xl)/g, (match) => map[match] || match);
    });

    const indentStyles = [
        "ml-0", // LIVRE
        "ml-2", // TITRE
        "ml-4", // CHAPITRE
        "ml-6", // SECTION
        "ml-8", // PARAGRAPHE
        "ml-8", // Autres
    ];

    return (
        <div className={cn("w-full", indentStyles[Math.min(level, 5)])}>
            <button
                onClick={onToggle}
                className={cn(
                    "flex items-center w-full text-left cursor-pointer",
                    "rounded-lg px-3 py-2.5",
                    "transition-all duration-200",
                    "hover:bg-muted/60",
                    "group/section",
                    adjustedHeaderStyles[Math.min(level, 5)]
                )}
            >
                <span className={cn(
                    "mr-2.5 flex-shrink-0 transition-transform duration-200",
                    isOpen && "rotate-90"
                )}>
                    <ChevronRight className="h-4 w-4" />
                </span>
                <span className="flex-1 tracking-tight">{section.titre}</span>
                {hasArticles && (
                    <span className={cn(
                        "text-[11px] font-medium px-2 py-0.5 rounded-full ml-2",
                        "bg-primary/8 text-primary/70",
                        "group-hover/section:bg-primary/12",
                        "transition-colors duration-150"
                    )}>
                        {section.articles.length} art.
                    </span>
                )}
            </button>

            {/* Animated expand/collapse with CSS grid */}
            <div
                className="section-content-wrapper"
                data-open={isOpen && hasArticles}
            >
                <div className="section-content-inner">
                    <div className="space-y-3 pl-4 ml-2 pt-2">
                        {section.articles.map(article => (
                            <ArticleBlock key={article.id} article={article} fontSize={fontSize} searchQuery={searchQuery} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function HighlightText({ text, query }: { text: string; query: string }) {
    if (!query.trim()) return <>{text || '\u00A0'}</>;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase() ? (
                    <mark key={i} className="bg-yellow-200 dark:bg-yellow-800/60 text-inherit rounded-sm px-0.5">{part}</mark>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </>
    );
}

function ArticleBlock({ article, fontSize, searchQuery = '' }: { article: Article; fontSize: 'sm' | 'md' | 'lg'; searchQuery?: string }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const isLongContent = article.contenu.length > 500;

    // Auto-expand if search matches in the truncated part
    const hasSearchMatch = searchQuery.trim() && article.contenu.toLowerCase().includes(searchQuery.toLowerCase());
    const shouldExpand = isExpanded || (isLongContent && hasSearchMatch);

    const displayContent = shouldExpand || !isLongContent
        ? article.contenu
        : article.contenu.substring(0, 500);

    const textSize = {
        sm: 'text-sm leading-relaxed',
        md: 'text-base leading-relaxed',
        lg: 'text-lg leading-loose'
    }[fontSize];

    const isAbrogated = article.etat === 'ABROGE';
    const etatStyle = article.etat && article.etat !== 'VIGUEUR'
        ? ETAT_STYLES[article.etat] || "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        : null;

    return (
        <div
            id={`article-${article.numero}`}
            className={cn(
                "article-card scroll-mt-24 group relative",
                "rounded-xl border border-border/40 dark:border-border/20 bg-card",
                "border-l-[3px] border-l-transparent",
                "px-5 py-4",
                "transition-all duration-200",
                isAbrogated && "opacity-60",
            )}
        >
            {/* Article header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    {/* Article number badge */}
                    <span className={cn(
                        "inline-flex items-center justify-center",
                        "min-w-[2.5rem] px-2.5 py-1",
                        "rounded-lg text-xs font-bold tracking-wide",
                        "bg-primary/10 text-primary",
                        "dark:bg-primary/15 dark:text-primary",
                        fontSize === 'lg' && "text-sm px-3 py-1.5"
                    )}>
                        {article.numero}
                    </span>
                    <h4 className={cn(
                        "font-semibold text-foreground/90",
                        fontSize === 'sm' ? 'text-sm' : fontSize === 'md' ? 'text-base' : 'text-lg'
                    )}>
                        Article {article.numero}
                    </h4>
                    {/* Permalink - visible on hover */}
                    <a
                        href={`#article-${article.numero}`}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-muted-foreground hover:text-primary"
                        title="Lien permanent"
                    >
                        <Link2 className="h-3.5 w-3.5" />
                    </a>
                </div>
                {/* State badge */}
                {etatStyle && (
                    <span className={cn(
                        "text-[11px] font-medium px-2.5 py-1 rounded-full",
                        etatStyle
                    )}>
                        {article.etat}
                    </span>
                )}
            </div>

            {/* Divider */}
            <div className="h-px bg-border/60 mb-3" />

            {/* Article content */}
            <div className={cn(
                "prose dark:prose-invert max-w-none text-justify",
                textSize,
                !shouldExpand && isLongContent && "content-fade-mask",
            )}>
                {displayContent.split('\n').map((line, i) => (
                    <p key={i} className="mb-2 text-foreground/85">
                        {searchQuery ? <HighlightText text={line || '\u00A0'} query={searchQuery} /> : (line || '\u00A0')}
                    </p>
                ))}
            </div>

            {/* "Lire la suite" button */}
            {isLongContent && !hasSearchMatch && (
                <div className={cn(
                    "flex justify-center",
                    !isExpanded ? "-mt-1 pt-2" : "mt-2"
                )}>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={cn(
                            "inline-flex items-center gap-1.5",
                            "text-xs font-medium text-primary",
                            "px-4 py-1.5 rounded-full",
                            "bg-primary/5 hover:bg-primary/10",
                            "transition-colors duration-150",
                            "border border-primary/10"
                        )}
                    >
                        {isExpanded ? (
                            <>Voir moins <ChevronUp className="h-3 w-3" /></>
                        ) : (
                            <>Lire la suite <ChevronDown className="h-3 w-3" /></>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
