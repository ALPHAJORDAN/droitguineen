
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    ChevronDown,
    ChevronRight,
    Book,
    FileText,
    Gavel,
    ScrollText,
    Scale,
    Library,
    Archive
} from "lucide-react";
import { useState } from "react";

type MenuItem = {
    title: string;
    href?: string;
    icon?: React.ReactNode;
    children?: MenuItem[];
    isOpen?: boolean;
};

const menuItems: MenuItem[] = [
    {
        title: "Constitution",
        href: "/recherche?type=Constitution",
        icon: <Scale className="h-4 w-4" />,
    },
    {
        title: "Lois",
        icon: <Gavel className="h-4 w-4" />,
        children: [
            { title: "Ordinaires", href: "/recherche?type=Lois&subtype=Ordinaires" },
            { title: "Organiques", href: "/recherche?type=Lois&subtype=Organiques" },
            { title: "Finances", href: "/recherche?type=Lois&subtype=Finances" },
            { title: "Révisions", href: "/recherche?type=Lois&subtype=Révisions" },
        ],
    },
    {
        title: "Ordonnances",
        href: "/recherche?type=Ordonnances",
        icon: <FileText className="h-4 w-4" />,
    },
    {
        title: "Décrets",
        icon: <ScrollText className="h-4 w-4" />,
        children: [
            { title: "Présidentiels", href: "/recherche?type=Décrets&subtype=Présidentiels" },
            { title: "Premier Ministre", href: "/recherche?type=Décrets&subtype=Premier Ministre" },
            { title: "Application", href: "/recherche?type=Décrets&subtype=Application" },
        ],
    },
    {
        title: "Arrêtés",
        icon: <FileText className="h-4 w-4" />,
        children: [
            { title: "Ministériels", href: "/recherche?type=Arrêtés&subtype=Ministériels" },
            { title: "Interministériels", href: "/recherche?type=Arrêtés&subtype=Interministériels" },
            { title: "Gouvernoraux", href: "/recherche?type=Arrêtés&subtype=Gouvernoraux" },
            { title: "Préfectoraux", href: "/recherche?type=Arrêtés&subtype=Préfectoraux" },
            { title: "Communaux", href: "/recherche?type=Arrêtés&subtype=Communaux" },
        ],
    },
    {
        title: "Décisions",
        icon: <FileText className="h-4 w-4" />,
        children: [
            { title: "Circulaires", href: "/recherche?type=Décisions&subtype=Circulaires" },
            { title: "Notes", href: "/recherche?type=Décisions&subtype=Notes" },
            { title: "Instructions", href: "/recherche?type=Décisions&subtype=Instructions" },
        ],
    },
    {
        title: "Codes",
        icon: <Book className="h-4 w-4" />,
        children: [
            { title: "Code Pénal", href: "/lois/code-penal" },
            { title: "Code Procédure Pénale", href: "/lois/code-procedure-penale" },
            { title: "Code Civil", href: "/lois/code-civil" },
            { title: "Code du Travail", href: "/lois/code-travail" },
            { title: "Code Minier", href: "/lois/code-minier" },
            { title: "Code Électoral", href: "/lois/code-electoral" },
            { title: "Code Foncier", href: "/lois/code-foncier" },
            { title: "Autres", href: "/recherche?type=Codes" },
        ],
    },
    {
        title: "Jurisprudence",
        icon: <Scale className="h-4 w-4" />,
        children: [
            { title: "Cour Suprême", href: "/recherche?type=Jurisprudence&jurisdiction=Cour Suprême" },
            { title: "Cours d'Appel", href: "/recherche?type=Jurisprudence&jurisdiction=Cours d'Appel" },
            { title: "Tribunaux Première Instance", href: "/recherche?type=Jurisprudence&jurisdiction=TPI" },
            { title: "Tribunaux Militaires", href: "/recherche?type=Jurisprudence&jurisdiction=TM" },
            { title: "Juridictions Spéciales", href: "/recherche?type=Jurisprudence&jurisdiction=Spéciales" },
        ],
    },
    {
        title: "Journal Officiel",
        icon: <Library className="h-4 w-4" />,
        children: [
            { title: "2025", href: "/recherche?type=Journal Officiel&year=2025" },
            { title: "2024", href: "/recherche?type=Journal Officiel&year=2024" },
            { title: "Archives", href: "/recherche?type=Journal Officiel" },
        ],
    },
    {
        title: "Traités",
        icon: <FileText className="h-4 w-4" />,
        children: [
            { title: "ONU", href: "/recherche?type=Traités&org=ONU" },
            { title: "Union Africaine", href: "/recherche?type=Traités&org=UA" },
            { title: "CEDEAO", href: "/recherche?type=Traités&org=CEDEAO" },
            { title: "Bilatéraux", href: "/recherche?type=Traités&subtype=Bilatéraux" },
        ],
    },
    {
        title: "Archives",
        icon: <Archive className="h-4 w-4" />,
        children: [
            { title: "1958-1984", href: "/recherche?period=1958-1984" },
            { title: "1984-2008", href: "/recherche?period=1984-2008" },
            { title: "2008-2010", href: "/recherche?period=2008-2010" },
            { title: "2010-2021", href: "/recherche?period=2010-2021" },
            { title: "Périodes Transitoires", href: "/recherche?period=Transitoire" },
        ],
    },
];

interface SidebarProps {
    className?: string;
    onItemClick?: () => void;
}

export function Sidebar({ className, onItemClick }: SidebarProps) {
    const pathname = usePathname();
    const [openItems, setOpenItems] = useState<string[]>([]);

    const toggleItem = (title: string) => {
        setOpenItems((prev) =>
            prev.includes(title)
                ? prev.filter((item) => item !== title)
                : [...prev, title]
        );
    };

    const isActive = (href?: string) => href && pathname.startsWith(href);

    return (
        <div className={cn("w-64 border-r bg-background min-h-[calc(100vh-4rem)] p-4 overflow-y-auto", className)}>
            <div className="space-y-1">
                {menuItems.map((item) => (
                    <div key={item.title}>
                        {item.children ? (
                            <div>
                                <button
                                    onClick={() => toggleItem(item.title)}
                                    className={cn(
                                        "flex w-full items-center justify-between rounded-full px-4 py-3 text-sm font-medium transition-colors hover:bg-accent/50",
                                        openItems.includes(item.title) && "bg-accent text-accent-foreground font-semibold"
                                    )}
                                >
                                    <span className="flex items-center gap-2">
                                        {item.icon}
                                        {item.title}
                                    </span>
                                    {openItems.includes(item.title) ? (
                                        <ChevronDown className="h-4 w-4" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4" />
                                    )}
                                </button>
                                {openItems.includes(item.title) && (
                                    <div className="ml-4 mt-1 space-y-1 border-l pl-2">
                                        {item.children.map((child) => (
                                            <Link
                                                key={child.title}
                                                href={child.href!}
                                                onClick={onItemClick}
                                                className={cn(
                                                    "block rounded-full px-4 py-2 text-sm transition-colors hover:bg-accent/50",
                                                    isActive(child.href) && "bg-primary/10 text-primary font-semibold"
                                                )}
                                            >
                                                {child.title}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                href={item.href!}
                                onClick={onItemClick}
                                className={cn(
                                    "flex items-center gap-3 rounded-full px-4 py-3 text-sm font-medium transition-colors hover:bg-accent/50",
                                    isActive(item.href) && "bg-accent text-accent-foreground font-semibold"
                                )}
                            >
                                {item.icon}
                                {item.title}
                            </Link>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
