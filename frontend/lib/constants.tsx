import { Scale, BookOpen, Gavel, FileCheck, FileText, ScrollText } from "lucide-react";

const NATURE_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    LOI: Scale,
    LOI_ORGANIQUE: Scale,
    LOI_CONSTITUTIONNELLE: BookOpen,
    ORDONNANCE: Gavel,
    DECRET: FileCheck,
    DECRET_LOI: FileCheck,
    ARRETE: FileText,
    CIRCULAIRE: FileText,
    DECISION: FileText,
    CONVENTION: ScrollText,
    TRAITE: ScrollText,
    CODE: BookOpen,
    JURISPRUDENCE: Gavel,
    AUTRE: FileText,
};

export function getNatureIcon(nature: string, size: "sm" | "md" = "sm"): React.ReactNode {
    const sizeClass = size === "sm" ? "h-5 w-5" : "h-6 w-6";
    const IconComponent = NATURE_ICON_MAP[nature] || FileText;
    return <IconComponent className={sizeClass} />;
}
