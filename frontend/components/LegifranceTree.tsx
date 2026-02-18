import { Section, Article } from "@/lib/api";
import { ChevronRight, ChevronDown } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

interface LegifranceTreeProps {
    sections: Section[];
    level?: number;
    allArticles?: Article[]; // Tous les articles du texte pour les récupérer par sectionId
}

export function LegifranceTree({ sections, level = 0, allArticles = [] }: LegifranceTreeProps) {
    if (!sections || sections.length === 0) return null;

    return (
        <div className="space-y-2">
            {sections.map((section) => (
                <SectionItem 
                    key={section.id} 
                    section={section} 
                    level={level} 
                    allArticles={allArticles}
                />
            ))}
        </div>
    );
}

function SectionItem({ section, level, allArticles = [] }: { section: Section; level: number; allArticles?: Article[] }) {
    const [isOpen, setIsOpen] = useState(level === 0); // Ouvrir automatiquement les sections de premier niveau
    
    // Récupérer les articles de cette section depuis allArticles (plus fiable)
    const sectionArticles = useMemo(() => {
        const fromSection = section.articles || [];
        const fromAllArticles = allArticles.filter(a => a.section?.id === section.id);
        // Utiliser fromAllArticles si disponible et plus complet
        return fromAllArticles.length > 0 ? fromAllArticles : fromSection;
    }, [section.id, section.articles, allArticles]);

    const hasContent = sectionArticles.length > 0 || (section.enfants && section.enfants.length > 0);

    const toggle = () => {
        setIsOpen(!isOpen);
    };

    // Styles based on level (Livre > Titre > Chapitre...)
    const headerStyles = [
        "text-xl font-bold uppercase border-b-2 border-primary/20 pb-2 mt-6", // Level 0 (Livre)
        "text-lg font-semibold uppercase text-primary/80 mt-4",             // Level 1 (Titre)
        "text-base font-semibold text-gray-800 mt-2",                       // Level 2 (Chapitre)
        "text-sm font-medium italic text-gray-600 pl-4",                    // Level 3 (Section)
        "text-sm text-gray-500 pl-6"                                       // Level 4+
    ];

    const currentHeaderStyle = headerStyles[Math.min(level, headerStyles.length - 1)];

    return (
        <div className="w-full">
            <div
                onClick={toggle}
                className={cn(
                    "flex items-center cursor-pointer hover:bg-muted/10 transition-colors py-1 group select-none",
                    currentHeaderStyle
                )}
            >
                <span className="mr-2 text-primary/50 group-hover:text-primary transition-colors">
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </span>
                <span>{section.titre}</span>
            </div>

            {isOpen && hasContent && (
                <div className="ml-2 pl-4 border-l border-primary/10 mt-1 space-y-4">
                    {/* Articles of this section */}
                    {sectionArticles.map((article) => (
                        <ArticleItem key={article.id} article={article} />
                    ))}

                    {/* Sub-sections */}
                    {section.enfants && (
                        <LegifranceTree sections={section.enfants} level={level + 1} allArticles={allArticles} />
                    )}
                </div>
            )}
        </div>
    );
}

function ArticleItem({ article }: { article: Article }) {
    return (
        <div id={`article-${article.numero}`} className="py-4 scroll-mt-24 group">
            <h4 className="font-bold text-base text-primary mb-2 flex items-center">
                Article {article.numero}
                <span className="ml-2 opacity-0 group-hover:opacity-100 text-xs text-muted-foreground font-normal cursor-pointer hover:underline transition-opacity">
                    #Lien permanent
                </span>
            </h4>
            <div className="prose prose-sm max-w-none text-justify leading-relaxed text-gray-800">
                {article.contenu.split('\n').map((line, i) => (
                    <p key={i} className="mb-2 min-h-[1.5em]">{line}</p>
                ))}
            </div>
        </div>
    )
}
