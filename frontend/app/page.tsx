"use client";

import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { SearchBar } from "@/components/ui/SearchBar";
import { Button } from "@/components/ui/Button";
import { useLois } from "@/lib/hooks";
import { NATURE_LABELS, Texte } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import {
    BookOpen, Scale, FileText, ArrowRight, Gavel, FileCheck, ScrollText,
    Calendar, Loader2, Database
} from "lucide-react";

const NATURE_ICONS: Record<string, React.ReactNode> = {
    LOI: <Scale className="h-5 w-5" />,
    LOI_ORGANIQUE: <Scale className="h-5 w-5" />,
    LOI_CONSTITUTIONNELLE: <BookOpen className="h-5 w-5" />,
    ORDONNANCE: <Gavel className="h-5 w-5" />,
    DECRET: <FileCheck className="h-5 w-5" />,
    CODE: <BookOpen className="h-5 w-5" />,
    ARRETE: <FileText className="h-5 w-5" />,
    JURISPRUDENCE: <Gavel className="h-5 w-5" />,
};

const CATEGORIES = [
    { nature: "LOI_CONSTITUTIONNELLE", label: "Constitution", description: "Loi fondamentale", icon: <BookOpen className="h-8 w-8" /> },
    { nature: "LOI", label: "Lois", description: "Textes législatifs", icon: <ScrollText className="h-8 w-8" /> },
    { nature: "ORDONNANCE", label: "Ordonnances", description: "Actes du pouvoir exécutif", icon: <Gavel className="h-8 w-8" /> },
    { nature: "DECRET", label: "Décrets", description: "Actes réglementaires", icon: <FileCheck className="h-8 w-8" /> },
    { nature: "CODE", label: "Codes", description: "Recueils thématiques", icon: <BookOpen className="h-8 w-8" /> },
    { nature: "JURISPRUDENCE", label: "Jurisprudence", description: "Décisions de justice", icon: <Scale className="h-8 w-8" /> },
];

function HomeContent() {
    // Stats queries (limit: 1, only need pagination.total)
    const allTextes = useLois({ limit: 1 });
    const lois = useLois({ limit: 1, nature: "LOI" });
    const decrets = useLois({ limit: 1, nature: "DECRET" });
    const codes = useLois({ limit: 1, nature: "CODE" });
    const ordonnances = useLois({ limit: 1, nature: "ORDONNANCE" });
    const constitutions = useLois({ limit: 1, nature: "LOI_CONSTITUTIONNELLE" });
    const jurisprudence = useLois({ limit: 1, nature: "JURISPRUDENCE" });

    // Recent texts
    const recent = useLois({ limit: 6 });
    const recentTextes = recent.data?.data || [];

    const statsLoading = allTextes.isLoading;
    const totalCount = allTextes.data?.pagination.total ?? 0;

    const getCategoryCount = (nature: string): number | null => {
        const map: Record<string, typeof lois> = {
            LOI: lois, DECRET: decrets, CODE: codes, ORDONNANCE: ordonnances,
            LOI_CONSTITUTIONNELLE: constitutions, JURISPRUDENCE: jurisprudence,
        };
        return map[nature]?.data?.pagination.total ?? null;
    };

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
                {/* Hero Section */}
                <section className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-b from-accent/30 via-background to-background">
                    <div className="container px-4 md:px-6 w-full -mt-[80px]">
                        <div className="flex flex-col items-center space-y-8 text-center">
                            <div className="space-y-4 max-w-3xl">
                                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                                    Le Droit Guinéen, <span className="text-primary">Accessible à Tous</span>
                                </h1>
                                <p className="mx-auto max-w-[700px] text-muted-foreground text-lg md:text-xl">
                                    Accédez facilement aux lois, décrets et au Journal Officiel de la République de Guinée.
                                </p>
                            </div>
                            <div className="w-full max-w-4xl px-4">
                                <SearchBar />
                            </div>

                            {/* Stats inline */}
                            {!statsLoading && totalCount > 0 && (
                                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                        <Database className="h-3.5 w-3.5" />
                                        <strong className="text-foreground">{totalCount}</strong> textes
                                    </span>
                                    {lois.data && (
                                        <span><strong className="text-foreground">{lois.data.pagination.total}</strong> lois</span>
                                    )}
                                    {decrets.data && (
                                        <span><strong className="text-foreground">{decrets.data.pagination.total}</strong> décrets</span>
                                    )}
                                    {codes.data && (
                                        <span><strong className="text-foreground">{codes.data.pagination.total}</strong> codes</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Navigation par type juridique */}
                <section className="w-full py-16 md:py-24 bg-background">
                    <div className="container px-4 md:px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Explorer par catégorie</h2>
                            <p className="mt-2 text-muted-foreground">
                                Parcourez les textes selon la hiérarchie des normes guinéennes
                            </p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {CATEGORIES.map((cat) => {
                                const count = getCategoryCount(cat.nature);
                                return (
                                    <Link
                                        key={cat.nature}
                                        href={`/lois?nature=${cat.nature}`}
                                        className="group flex flex-col items-center space-y-3 text-center p-6 border rounded-3xl hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-card"
                                    >
                                        <div className="p-4 bg-primary/10 rounded-full text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                                            {cat.icon}
                                        </div>
                                        <h3 className="text-lg font-bold">{cat.label}</h3>
                                        <p className="text-sm text-muted-foreground">{cat.description}</p>
                                        {count !== null && (
                                            <span className="text-xs font-medium px-3 py-1 bg-muted rounded-full">
                                                {count} texte{count > 1 ? "s" : ""}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Textes récemment ajoutés */}
                <section className="w-full py-16 md:py-24 bg-muted/20 border-t">
                    <div className="container px-4 md:px-6">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Textes récents</h2>
                                <p className="mt-1 text-muted-foreground">
                                    Les derniers textes ajoutés à la plateforme
                                </p>
                            </div>
                            <Link href="/lois">
                                <Button variant="outline" className="hidden sm:inline-flex gap-2">
                                    Voir tout <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>

                        {recent.isLoading && (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <span className="ml-2 text-muted-foreground">Chargement...</span>
                            </div>
                        )}

                        {recent.isError && (
                            <div className="text-center py-12 text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Impossible de charger les textes récents.</p>
                                <p className="text-sm mt-1">Vérifiez que le serveur backend est démarré.</p>
                            </div>
                        )}

                        {!recent.isLoading && !recent.isError && (
                            <>
                                {recentTextes.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>Aucun texte disponible pour le moment.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {recentTextes.map((texte: Texte) => (
                                            <Link
                                                key={texte.id}
                                                href={`/lois/${texte.id}`}
                                                className="group border rounded-lg p-5 hover:border-primary hover:shadow-md transition-all bg-card"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className="p-3 bg-primary/10 rounded-lg text-primary flex-shrink-0">
                                                        {NATURE_ICONS[texte.nature] || <FileText className="h-5 w-5" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                            <span className="text-xs font-medium px-2 py-0.5 bg-muted rounded">
                                                                {NATURE_LABELS[texte.nature] || texte.nature}
                                                            </span>
                                                            {texte.etat === "VIGUEUR" && (
                                                                <span className="text-xs font-medium px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                                                                    En vigueur
                                                                </span>
                                                            )}
                                                            {texte.etat === "ABROGE" && (
                                                                <span className="text-xs font-medium px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded">
                                                                    Abrogé
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h3 className="text-base font-semibold group-hover:text-primary transition-colors line-clamp-2">
                                                            {texte.titre}
                                                        </h3>
                                                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                                            {texte.numero && <span>{texte.numero}</span>}
                                                            {texte.datePublication && (
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="h-3 w-3" />
                                                                    {formatDate(texte.datePublication)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}

                                {recentTextes.length > 0 && (
                                    <div className="text-center mt-8 sm:hidden">
                                        <Link href="/lois">
                                            <Button variant="outline" className="gap-2">
                                                Voir tous les textes <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}

export default function Home() {
    return <HomeContent />;
}
