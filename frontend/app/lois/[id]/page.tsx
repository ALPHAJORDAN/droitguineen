import { Metadata } from "next";
import { getLoi, NATURE_LABELS } from "@/lib/api";
import { LawDetailsClient } from "./LawDetailsClient";

// Generate dynamic metadata for SEO
export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const resolvedParams = await params;

    try {
        const texte = await getLoi(resolvedParams.id);
        const natureLabel = NATURE_LABELS[texte.nature] || texte.nature;

        return {
            title: texte.titre,
            description: `${natureLabel} - ${texte.titre}. ${texte.numero ? `N° ${texte.numero}.` : ""} Consultez le texte intégral sur Legifrance-Guinée.`,
            openGraph: {
                title: texte.titre,
                description: `${natureLabel} de la République de Guinée`,
                type: "article",
                publishedTime: texte.datePublication || undefined,
                authors: texte.signataires ? [texte.signataires] : undefined,
                tags: [natureLabel, "Guinée", "droit", "législation"],
            },
            twitter: {
                card: "summary",
                title: texte.titre,
                description: `${natureLabel} - Consultez le texte intégral`,
            },
            alternates: {
                canonical: `/lois/${resolvedParams.id}`,
            },
        };
    } catch {
        return {
            title: "Texte juridique",
            description: "Consultez les textes juridiques de la République de Guinée",
        };
    }
}

export default async function LawDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const resolvedParams = await params;
    let initialData = undefined;

    try {
        initialData = await getLoi(resolvedParams.id);
    } catch (e) {
        console.error("Failed to fetch loi server-side:", e);
    }

    return <LawDetailsClient id={resolvedParams.id} initialData={initialData} />;
}