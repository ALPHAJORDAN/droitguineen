import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Recherche",
    description: "Recherchez dans l'ensemble des textes juridiques de la République de Guinée : lois, décrets, ordonnances, arrêtés, codes et jurisprudence.",
    openGraph: {
        title: "Recherche - Legifrance-Guinée",
        description: "Recherchez dans l'ensemble des textes juridiques guinéens",
    },
};

export default function RechercheLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
