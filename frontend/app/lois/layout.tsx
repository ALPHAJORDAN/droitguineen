import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Lois et Textes Juridiques",
    description: "Consultez l'ensemble des textes législatifs et réglementaires de la République de Guinée : lois, décrets, ordonnances, arrêtés et codes.",
    openGraph: {
        title: "Lois et Textes Juridiques - Legifrance-Guinée",
        description: "L'ensemble des textes législatifs guinéens en ligne",
    },
};

export default function LoisLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
