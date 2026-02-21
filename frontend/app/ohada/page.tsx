"use client";

import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { TexteCard } from "@/components/TexteCard";
import { LoadingState, EmptyState } from "@/components/ui/StateDisplay";
import { useLois } from "@/lib/hooks";
import { Texte } from "@/lib/api";
import Link from "next/link";
import {
    Scale, Gavel, ScrollText, FileCheck, ArrowRight, BookOpen, Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const OHADA_CATEGORIES = [
    {
        nature: "ACTE_UNIFORME_OHADA",
        type: "Actes uniformes OHADA",
        label: "Actes Uniformes",
        description: "Textes adoptés par le Conseil des Ministres de l'OHADA, directement applicables dans les États membres",
        icon: <Scale className="h-8 w-8" />,
        examples: "AUDCG, AUSCGIE, AUPSRVE, AUS, AUPCAP...",
    },
    {
        nature: "JURISPRUDENCE_CCJA",
        type: "Jurisprudence CCJA",
        label: "Jurisprudence CCJA",
        description: "Arrêts et avis de la Cour Commune de Justice et d'Arbitrage",
        icon: <Gavel className="h-8 w-8" />,
        examples: "Arrêts, avis consultatifs, ordonnances",
    },
    {
        nature: "TRAITE_OHADA",
        type: "Traites OHADA",
        label: "Traités",
        description: "Traité fondateur de Port-Louis (1993) et Traité révisé de Québec (2008)",
        icon: <ScrollText className="h-8 w-8" />,
        examples: "Traité de Port-Louis, Traité révisé",
    },
    {
        nature: "REGLEMENT_OHADA",
        type: "Reglements OHADA",
        label: "Règlements",
        description: "Règlements de procédure, d'arbitrage et comptables de l'OHADA",
        icon: <FileCheck className="h-8 w-8" />,
        examples: "Règlement de procédure CCJA, Règlement d'arbitrage",
    },
];

export default function OhadaPage() {
    const { data: recentData, isLoading } = useLois({
        nature: "ACTE_UNIFORME_OHADA,JURISPRUDENCE_CCJA,TRAITE_OHADA,REGLEMENT_OHADA",
        limit: 6,
        sort: "datePublication",
        order: "desc",
    });

    const recentTextes = recentData?.data ?? [];

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main id="main-content" className="flex-1">
                {/* Hero */}
                <section className="w-full bg-gradient-to-b from-accent/30 to-background border-b">
                    <div className="container px-4 md:px-6 py-16 md:py-24">
                        <div className="flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto">
                            <div className="p-4 bg-primary/10 rounded-2xl text-primary">
                                <BookOpen className="h-12 w-12" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                                Droit <span className="text-primary">OHADA</span>
                            </h1>
                            <p className="text-muted-foreground text-lg max-w-2xl">
                                Organisation pour l&apos;Harmonisation en Afrique du Droit des Affaires.
                                Consultez les Actes Uniformes, la jurisprudence de la CCJA, les traités
                                et règlements applicables en Guinée.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Categories */}
                <section className="w-full py-16 bg-background">
                    <div className="container px-4 md:px-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            {OHADA_CATEGORIES.map((cat) => (
                                <Link
                                    key={cat.nature}
                                    href={`/recherche?type=${encodeURIComponent(cat.type)}`}
                                    className="group flex gap-5 p-6 border rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-[1.01] bg-card"
                                >
                                    <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300 flex-shrink-0 h-fit">
                                        {cat.icon}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-lg font-bold mb-1">{cat.label}</h3>
                                        <p className="text-sm text-muted-foreground mb-2">{cat.description}</p>
                                        <p className="text-xs text-muted-foreground/70 italic">{cat.examples}</p>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors ml-auto flex-shrink-0 mt-1" />
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Creation d'entreprise */}
                <section className="w-full py-8 bg-primary/5 border-t">
                    <div className="container px-4 md:px-6">
                        <Link
                            href="/creation-entreprise"
                            className="group flex flex-col sm:flex-row items-center gap-5 p-6 border rounded-2xl hover:shadow-lg transition-all duration-300 bg-card"
                        >
                            <div className="p-4 bg-primary/10 rounded-2xl text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300 flex-shrink-0">
                                <Briefcase className="h-8 w-8" />
                            </div>
                            <div className="text-center sm:text-left flex-1">
                                <h3 className="text-lg font-bold mb-1">Creer une entreprise</h3>
                                <p className="text-sm text-muted-foreground">
                                    Guide pratique : formes juridiques, demarches administratives et textes de reference OHADA
                                </p>
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                        </Link>
                    </div>
                </section>

                {/* Recent OHADA texts */}
                <section className="w-full py-16 bg-muted/20 border-t">
                    <div className="container px-4 md:px-6">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">Textes OHADA récents</h2>
                                <p className="mt-1 text-muted-foreground">
                                    Les derniers textes OHADA ajoutés à la plateforme
                                </p>
                            </div>
                            <Link href="/recherche?type=Actes uniformes OHADA">
                                <Button variant="outline" className="hidden sm:inline-flex gap-2">
                                    Voir tout <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>

                        {isLoading && <LoadingState message="Chargement..." />}

                        {!isLoading && recentTextes.length === 0 && (
                            <EmptyState
                                title="Aucun texte OHADA disponible"
                                description="Les textes OHADA seront bientôt ajoutés à la plateforme."
                            />
                        )}

                        {!isLoading && recentTextes.length > 0 && (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {recentTextes.map((texte: Texte) => (
                                    <TexteCard key={texte.id} texte={texte} compact />
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
