"use client";

import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { SearchBar } from "@/components/ui/SearchBar";
import { Button } from "@/components/ui/Button";
import { TexteCard } from "@/components/TexteCard";
import { LoadingState, EmptyState } from "@/components/ui/StateDisplay";
import { getNatureIcon } from "@/lib/constants";
import { useStats } from "@/lib/hooks";
import { NATURE_LABELS, Texte } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import {
    BookOpen, Scale, FileText, ArrowRight, Gavel, FileCheck, ScrollText,
    Loader2, Database, Search, Download, Compass, BookMarked,
    CheckCircle, FolderOpen, Shield,
} from "lucide-react";

const CATEGORIES = [
    { nature: "LOI_CONSTITUTIONNELLE", type: "Constitution", label: "Constitution", description: "Loi fondamentale", icon: <BookOpen className="h-7 w-7" /> },
    { nature: "LOI", type: "Lois", label: "Lois", description: "Textes legislatifs", icon: <ScrollText className="h-7 w-7" /> },
    { nature: "LOI_ORGANIQUE", type: "Lois organiques", label: "Lois organiques", description: "Lois a valeur constitutionnelle", icon: <Scale className="h-7 w-7" /> },
    { nature: "ORDONNANCE", type: "Ordonnances", label: "Ordonnances", description: "Actes du pouvoir executif", icon: <Gavel className="h-7 w-7" /> },
    { nature: "DECRET", type: "Decrets", label: "Decrets", description: "Actes reglementaires", icon: <FileCheck className="h-7 w-7" /> },
    { nature: "ARRETE", type: "Arretes", label: "Arretes", description: "Decisions administratives", icon: <FileText className="h-7 w-7" /> },
    { nature: "CODE", type: "Codes", label: "Codes", description: "Recueils thematiques", icon: <BookOpen className="h-7 w-7" /> },
    { nature: "JURISPRUDENCE", type: "Jurisprudence", label: "Jurisprudence", description: "Decisions de justice", icon: <Scale className="h-7 w-7" /> },
    { nature: "TRAITE", type: "Traites", label: "Traites", description: "Accords internationaux", icon: <ScrollText className="h-7 w-7" /> },
    { nature: "CONVENTION", type: "Conventions", label: "Conventions", description: "Conventions internationales", icon: <ScrollText className="h-7 w-7" /> },
];

const FEATURES = [
    {
        icon: <Search className="h-6 w-6" />,
        title: "Recherche avancee",
        description: "Recherche plein texte dans tous les textes et articles avec filtres par type, etat et date.",
    },
    {
        icon: <BookMarked className="h-6 w-6" />,
        title: "Consultation structuree",
        description: "Textes organises avec table des matieres hierarchique et navigation par section.",
    },
    {
        icon: <Download className="h-6 w-6" />,
        title: "Export multi-format",
        description: "Telechargez les textes en PDF, Word (DOCX), HTML ou JSON.",
    },
    {
        icon: <Compass className="h-6 w-6" />,
        title: "Exploration par categorie",
        description: "Parcourez les textes par nature, etat, date de publication ou signataire.",
    },
];

function HomeContent() {
    const { user, isAuthenticated } = useAuth();
    const isAdmin = user?.role === "ADMIN" || user?.role === "EDITOR";

    // Single API call for all homepage stats (was 13 separate requests)
    const { data: stats, isLoading: statsLoading } = useStats();

    const totalCount = stats?.total ?? 0;
    const enVigueurCount = stats?.enVigueur ?? 0;
    const recentTextes = stats?.recent ?? [];
    const activeCategories = stats ? Object.values(stats.natureCounts).filter(c => c > 0).length : 0;

    const getCountForNature = (nature: string): number | null => {
        if (!stats) return null;
        return stats.natureCounts[nature] ?? 0;
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
                                    Le Droit Guineen, <span className="text-primary">Accessible a Tous</span>
                                </h1>
                                <p className="mx-auto max-w-[700px] text-muted-foreground text-lg md:text-xl">
                                    Accedez facilement aux lois, decrets et au Journal Officiel de la Republique de Guinee.
                                </p>
                            </div>
                            <div className="w-full max-w-4xl px-4">
                                <SearchBar />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stats Cards */}
                <section className="w-full py-12 bg-background border-b">
                    <div className="container px-4 md:px-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-card border rounded-xl p-5 text-center">
                                <div className="flex justify-center mb-2">
                                    <Database className="h-6 w-6 text-primary" />
                                </div>
                                <p className="text-2xl md:text-3xl font-bold">
                                    {statsLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : totalCount}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">Textes au total</p>
                            </div>
                            <div className="bg-card border rounded-xl p-5 text-center">
                                <div className="flex justify-center mb-2">
                                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <p className="text-2xl md:text-3xl font-bold">
                                    {statsLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : enVigueurCount}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">En vigueur</p>
                            </div>
                            <div className="bg-card border rounded-xl p-5 text-center">
                                <div className="flex justify-center mb-2">
                                    <FolderOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <p className="text-2xl md:text-3xl font-bold">
                                    {statsLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : activeCategories}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">Categories actives</p>
                            </div>
                            <div className="bg-card border rounded-xl p-5 text-center">
                                <div className="flex justify-center mb-2">
                                    <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <p className="text-2xl md:text-3xl font-bold">
                                    {statsLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : CATEGORIES.length}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">Types de textes</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Navigation par categorie */}
                <section className="w-full py-16 md:py-24 bg-background">
                    <div className="container px-4 md:px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Explorer par categorie</h2>
                            <p className="mt-2 text-muted-foreground">
                                Parcourez les textes selon la hierarchie des normes guineennes
                            </p>
                        </div>
                        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                            {CATEGORIES.map((cat) => {
                                const count = getCountForNature(cat.nature);
                                return (
                                    <Link
                                        key={cat.nature}
                                        href={`/recherche?type=${encodeURIComponent(cat.type)}`}
                                        className="group flex flex-col items-center space-y-2 text-center p-5 border rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-card"
                                    >
                                        <div className="p-3 bg-primary/10 rounded-full text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                                            {cat.icon}
                                        </div>
                                        <h3 className="text-sm font-bold">{cat.label}</h3>
                                        <p className="text-xs text-muted-foreground line-clamp-1">{cat.description}</p>
                                        {count !== null && count > 0 && (
                                            <span className="text-xs font-medium px-2.5 py-0.5 bg-muted rounded-full">
                                                {count} texte{count > 1 ? "s" : ""}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Textes recents */}
                <section className="w-full py-16 md:py-24 bg-muted/20 border-t">
                    <div className="container px-4 md:px-6">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Textes recents</h2>
                                <p className="mt-1 text-muted-foreground">
                                    Les derniers textes ajoutes a la plateforme
                                </p>
                            </div>
                            <Link href="/lois">
                                <Button variant="outline" className="hidden sm:inline-flex gap-2">
                                    Voir tout <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>

                        {statsLoading && <LoadingState message="Chargement..." />}

                        {!statsLoading && !stats && (
                            <EmptyState
                                title="Impossible de charger les textes recents."
                                description="Verifiez que le serveur backend est demarre."
                            />
                        )}

                        {!statsLoading && stats && (
                            <>
                                {recentTextes.length === 0 ? (
                                    <EmptyState title="Aucun texte disponible pour le moment." />
                                ) : (
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {recentTextes.map((texte: Texte) => (
                                            <TexteCard key={texte.id} texte={texte} compact />
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

                {/* Features Section */}
                <section className="w-full py-16 md:py-24 bg-background border-t">
                    <div className="container px-4 md:px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Ce que vous pouvez faire</h2>
                            <p className="mt-2 text-muted-foreground">
                                Des outils modernes pour acceder au droit guineen
                            </p>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {FEATURES.map((feature, i) => (
                                <div key={i} className="flex flex-col items-center text-center p-6 space-y-3">
                                    <div className="p-4 bg-primary/10 rounded-2xl text-primary">
                                        {feature.icon}
                                    </div>
                                    <h3 className="font-semibold">{feature.title}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="w-full py-12 bg-primary/5 border-t">
                    <div className="container px-4 md:px-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-semibold">Vous ne trouvez pas un texte ?</h3>
                                <p className="text-sm text-muted-foreground">
                                    Utilisez la recherche avancee avec filtres par type, etat et periode.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <Link href="/recherche">
                                    <Button className="gap-2">
                                        <Search className="h-4 w-4" />
                                        Recherche avancee
                                    </Button>
                                </Link>
                                {isAuthenticated && isAdmin && (
                                    <Link href="/admin">
                                        <Button variant="outline" className="gap-2">
                                            Administration
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
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
