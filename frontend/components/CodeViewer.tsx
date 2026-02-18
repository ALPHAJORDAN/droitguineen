"use client";

import { Article } from "@/lib/api";
import { ChevronRight, ChevronDown, FileText } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface CodeViewerProps {
    articles: Article[];
    fontSize?: 'sm' | 'md' | 'lg';
}

interface SectionNode {
    id: string;
    titre: string;
    articles: Article[];
    children: Map<string, SectionNode>;
}

export function CodeViewer({ articles, fontSize = 'sm' }: CodeViewerProps) {
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

    // Initialisation
    useState(() => {
        const initial = new Set<string>();
        tree.forEach(s => {
            if (getLevelFromTitle(s.titre) <= 1) initial.add(s.id);
        });
        setExpandedSections(initial);
    });

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
            <div className="space-y-4">
                {unsectionedArticles.map(article => (
                    <ArticleBlock key={article.id} article={article} fontSize={fontSize} />
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
                            />
                        ))}
                    </div>
                ))}
            </div>
            {/* Afficher les articles sans section à la fin */}
            {unsectionedArticles.length > 0 && tree.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                    <h3 className="text-lg font-semibold mb-4">Articles hors sections</h3>
                    {unsectionedArticles.map(article => (
                        <ArticleBlock key={article.id} article={article} fontSize={fontSize} />
                    ))}
                </div>
            )}
        </div>
    );
}

function getLevelFromTitle(titre: string): number {
    const upper = titre.toUpperCase();
    if (upper.startsWith('LIVRE')) return 0;
    if (upper.startsWith('TITRE')) return 1;
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
    onToggle 
}: { 
    section: SectionNode; 
    level: number; 
    fontSize: 'sm' | 'md' | 'lg';
    isOpen: boolean;
    onToggle: () => void;
}) {
    const hasArticles = section.articles.length > 0;

    const headerStyles = [
        "text-xl font-bold text-primary border-b-2 border-primary/30 pb-2 mb-4", // LIVRE
        "text-lg font-semibold text-primary/90 border-b border-primary/20 pb-1 mb-3", // TITRE
        "text-base font-semibold text-foreground mb-2", // CHAPITRE
        "text-sm font-medium text-muted-foreground italic mb-2", // SECTION
        "text-sm text-muted-foreground mb-1", // PARAGRAPHE
        "text-sm text-muted-foreground mb-1", // Autres
    ];

    // Adjust header sizes based on font size preference
    const adjustedHeaderStyles = headerStyles.map(style => {
        if (fontSize === 'md') return style.replace('text-sm', 'text-base').replace('text-base', 'text-lg').replace('text-lg', 'text-xl').replace('text-xl', 'text-2xl');
        if (fontSize === 'lg') return style.replace('text-sm', 'text-lg').replace('text-base', 'text-xl').replace('text-lg', 'text-2xl').replace('text-xl', 'text-3xl');
        return style;
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
                    "flex items-center w-full text-left cursor-pointer hover:bg-muted/50 rounded px-2 py-1 transition-colors",
                    adjustedHeaderStyles[Math.min(level, 5)]
                )}
            >
                <span className="mr-2 flex-shrink-0">
                    {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    )}
                </span>
                <span className="flex-1">{section.titre}</span>
                {hasArticles && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-2">
                        {section.articles.length} art.
                    </span>
                )}
            </button>

            {isOpen && hasArticles && (
                <div className="mt-2 space-y-4 border-l-2 border-primary/10 pl-4 ml-2">
                    {section.articles.map(article => (
                        <ArticleBlock key={article.id} article={article} fontSize={fontSize} />
                    ))}
                </div>
            )}
        </div>
    );
}

function ArticleBlock({ article, fontSize }: { article: Article; fontSize: 'sm' | 'md' | 'lg' }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const isLongContent = article.contenu.length > 500;
    const displayContent = isExpanded || !isLongContent
        ? article.contenu
        : article.contenu.substring(0, 500) + '...';

    const textSize = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg'
    }[fontSize];

    return (
        <div
            id={`article-${article.numero}`}
            className="py-3 scroll-mt-24 group border-b border-muted last:border-0"
        >
            <div className="flex items-center justify-between mb-2">
                <h4 className={cn("font-bold text-primary flex items-center",
                    fontSize === 'sm' ? 'text-base' : fontSize === 'md' ? 'text-lg' : 'text-xl'
                )}>
                    Article {article.numero}
                    <a
                        href={`#article-${article.numero}`}
                        className="ml-2 opacity-0 group-hover:opacity-100 text-xs text-muted-foreground font-normal hover:underline transition-opacity"
                    >
                        #
                    </a>
                </h4>
                {article.etat && article.etat !== 'VIGUEUR' && (
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                        {article.etat}
                    </span>
                )}
            </div>
            <div className={cn("prose dark:prose-invert max-w-none text-justify leading-relaxed", textSize)}>
                {displayContent.split('\n').map((line, i) => (
                    <p key={i} className="mb-1.5">
                        {line || '\u00A0'}
                    </p>
                ))}
            </div>
            {isLongContent && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs text-primary hover:underline mt-2"
                >
                    {isExpanded ? 'Voir moins' : 'Voir plus...'}
                </button>
            )}
        </div>
    );
}
