
"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { fetchLois, Texte } from "@/lib/api";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";

// Mapping des slugs vers les filtres API
const categoryMapping: Record<string, { nature?: string; sousCategorie?: string }> = {
    // Lois
    "lois": { nature: "LOI" },
    "lois/ordinaires": { nature: "LOI", sousCategorie: "ordinaires" },
    "lois/organiques": { nature: "LOI_ORGANIQUE" },
    "lois/finances": { nature: "LOI", sousCategorie: "finances" }, // Ou une nature spécifique si existe
    "lois/revisions": { nature: "LOI_CONSTITUTIONNELLE" },

    // Décrets
    "decrets": { nature: "DECRET" },
    "decrets/presidentiels": { nature: "DECRET", sousCategorie: "presidentiels" },
    "decrets/premier_ministre": { nature: "DECRET", sousCategorie: "premier_ministre" },
    "decrets/application": { nature: "DECRET", sousCategorie: "application" },

    // Ordonnances
    "ordonnances": { nature: "ORDONNANCE" },

    // Arrêtés
    "arretes": { nature: "ARRETE" },
    "arretes/ministeriels": { nature: "ARRETE", sousCategorie: "ministeriels" },
    "arretes/interministeriels": { nature: "ARRETE", sousCategorie: "interministeriels" },
    "arretes/gouvernoraux": { nature: "ARRETE", sousCategorie: "gouvernoraux" },
    "arretes/prefectoraux": { nature: "ARRETE", sousCategorie: "prefectoraux" },
    "arretes/communaux": { nature: "ARRETE", sousCategorie: "communaux" },

    // Décisions
    "decisions": { nature: "DECISION" },
    "decisions/circulaires": { nature: "CIRCULAIRE" },
    "decisions/notes": { nature: "DECISION", sousCategorie: "notes" },
    "decisions/instructions": { nature: "DECISION", sousCategorie: "instructions" },

    // Codes
    "codes": { nature: "CODE" },
    "codes/code-penal": { nature: "CODE", sousCategorie: "code-penal" },
    "codes/code-procedure-penale": { nature: "CODE", sousCategorie: "code-procedure-penale" },
    "codes/code-civil": { nature: "CODE", sousCategorie: "code-civil" },
    "codes/code-travail": { nature: "CODE", sousCategorie: "code-travail" },
    "codes/code-minier": { nature: "CODE", sousCategorie: "code-minier" },
    "codes/code-electoral": { nature: "CODE", sousCategorie: "code-electoral" },
    "codes/code-foncier": { nature: "CODE", sousCategorie: "code-foncier" },
    "codes/autres": { nature: "CODE", sousCategorie: "autres" },

    // Jurisprudence
    "jurisprudence": { nature: "JURISPRUDENCE" },
    "jurisprudence/cour-supreme": { nature: "JURISPRUDENCE", sousCategorie: "cour-supreme" },
    "jurisprudence/cours-appel": { nature: "JURISPRUDENCE", sousCategorie: "cours-appel" },
    "jurisprudence/tribunaux-premiere-instance": { nature: "JURISPRUDENCE", sousCategorie: "tribunaux-premiere-instance" },

    // Constitution
    "constitution": { nature: "LOI_CONSTITUTIONNELLE" },

    // Journal Officiel (exemple simplifié)
    "journal-officiel": { nature: "AUTRE", sousCategorie: "journal-officiel" },
};

export default function TextesPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const slug = Array.isArray(params.slug) ? params.slug.join("/") : params.slug;
    const pageParam = searchParams.get("page") || "1";

    const [textes, setTextes] = useState<Texte[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        async function loadTextes() {
            setLoading(true);
            setError(null);
            try {
                const mapping = categoryMapping[slug as string] || {};

                await new Promise(resolve => setTimeout(resolve, 500)); // Petit délai pour UX

                const result = await fetchLois({
                    page: parseInt(pageParam),
                    limit: 20,
                    nature: mapping.nature,
                    sousCategorie: mapping.sousCategorie,
                });

                setTextes(result.data);
                setTotal(result.pagination.total);
            } catch (err) {
                console.error("Error loading textes:", err);
                setError("Impossible de charger les textes. Veuillez réessayer.");
            } finally {
                setLoading(false);
            }
        }

        if (slug) {
            loadTextes();
        }
    }, [slug, pageParam]);

    const title = slug ? (slug as string).replace("/", " - ").toUpperCase() : "TEXTES";

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight text-primary">{title}</h1>
                <div className="text-sm text-muted-foreground">{total} textes trouvés</div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : textes.length === 0 ? (
                <div className="text-center py-12 bg-muted/20 rounded-lg">
                    <p className="text-muted-foreground">Aucun texte trouvé dans cette catégorie.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {textes.map((texte) => (
                        <Link
                            key={texte.id}
                            href={`/lois/${texte.id}`}
                            className="group block p-6 bg-card border rounded-lg hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Badge variant={texte.etat === "VIGUEUR" ? "default" : "secondary"}>
                                            {texte.etat === "VIGUEUR" ? "En vigueur" : texte.etat}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground font-medium">
                                            {texte.nature} {texte.numero}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                                        {texte.titre}
                                    </h3>
                                    {texte.dateSignature && (
                                        <p className="text-sm text-muted-foreground">
                                            Signé le {format(new Date(texte.dateSignature), "d MMMM yyyy", { locale: fr })}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
