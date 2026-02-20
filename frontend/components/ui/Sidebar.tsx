
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    ChevronDown,
    ChevronRight,
    Book,
    FileText,
    Gavel,
    ScrollText,
    Scale,
    BookOpen,
    FileCheck,
} from "lucide-react";
import { useState } from "react";

type MenuItem = {
    title: string;
    href?: string;
    icon?: React.ReactNode;
    children?: MenuItem[];
};

const menuItems: MenuItem[] = [
    {
        title: "Constitution",
        href: "/recherche?type=Constitution",
        icon: <BookOpen className="h-4 w-4" />,
    },
    {
        title: "Lois",
        icon: <Scale className="h-4 w-4" />,
        children: [
            { title: "Toutes les lois", href: "/recherche?type=Lois" },
            { title: "Lois organiques", href: "/recherche?type=Lois organiques" },
        ],
    },
    {
        title: "Ordonnances",
        href: "/recherche?type=Ordonnances",
        icon: <Gavel className="h-4 w-4" />,
    },
    {
        title: "Décrets",
        icon: <FileCheck className="h-4 w-4" />,
        children: [
            { title: "Tous les décrets", href: "/recherche?type=Decrets" },
            { title: "Décrets-lois", href: "/recherche?type=Decrets-lois" },
        ],
    },
    {
        title: "Arrêtés",
        href: "/recherche?type=Arretes",
        icon: <FileText className="h-4 w-4" />,
    },
    {
        title: "Décisions & Circulaires",
        icon: <ScrollText className="h-4 w-4" />,
        children: [
            { title: "Décisions", href: "/recherche?type=Decisions" },
            { title: "Circulaires", href: "/recherche?type=Circulaires" },
        ],
    },
    {
        title: "Codes",
        href: "/recherche?type=Codes",
        icon: <Book className="h-4 w-4" />,
    },
    {
        title: "Jurisprudence",
        href: "/recherche?type=Jurisprudence",
        icon: <Scale className="h-4 w-4" />,
    },
    {
        title: "Traités & Conventions",
        icon: <FileText className="h-4 w-4" />,
        children: [
            { title: "Traités", href: "/recherche?type=Traites" },
            { title: "Conventions", href: "/recherche?type=Conventions" },
        ],
    },
];

interface SidebarProps {
    className?: string;
    onItemClick?: () => void;
}

export function Sidebar({ className, onItemClick }: SidebarProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [openItems, setOpenItems] = useState<string[]>([]);

    const toggleItem = (title: string) => {
        setOpenItems((prev) =>
            prev.includes(title)
                ? prev.filter((item) => item !== title)
                : [...prev, title]
        );
    };

    const isActive = (href?: string) => {
        if (!href) return false;
        const url = new URL(href, "http://localhost");
        if (url.pathname !== pathname) return false;
        const type = url.searchParams.get("type");
        return type ? searchParams.get("type") === type : true;
    };

    return (
        <div className={cn("w-64 border-r bg-background min-h-[calc(100vh-4rem)] p-4 overflow-y-auto", className)}>
            <div className="space-y-1">
                {menuItems.map((item) => (
                    <div key={item.title}>
                        {item.children ? (
                            <div>
                                <button
                                    onClick={() => toggleItem(item.title)}
                                    aria-expanded={openItems.includes(item.title)}
                                    aria-label={`${item.title} — ${openItems.includes(item.title) ? 'replier' : 'déplier'}`}
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
