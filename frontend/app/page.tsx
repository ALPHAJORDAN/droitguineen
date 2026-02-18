"use client";

import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { SearchBar } from "@/components/ui/SearchBar";
import { Button } from "@/components/ui/Button";
import { useLois, queryKeys } from "@/lib/hooks";
import { fetchLois, NATURE_LABELS, ETAT_LABELS, Texte } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useQueries } from "@tanstack/react-query";
import Link from "next/link";
import {
    BookOpen, Scale, FileText, ArrowRight, Gavel, FileCheck, ScrollText,
    Calendar, Loader2, Database, Search, Download, Compass, BookMarked,
    CheckCircle, FolderOpen, Shield,
} from "lucide-react";

const ETAT_STYLES: Record<string, string> = {
    VIGUEUR: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    VIGUEUR_DIFF: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    MODIFIE: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    ABROGE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    ABROGE_DIFF: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    PERIME: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

const NATURE_ICONS: Record<string, React.ReactNode> = {
    LOI: <Scale className="h-5 w-5" />,
    LOI_ORGANIQUE: <Scale className="h-5 w-5" />,
    LOI_CONSTITUTIONNELLE: <BookOpen className="h-5 w-5" />,
    ORDONNANCE: <Gavel className="h-5 w-5" />,
    DECRET: <FileCheck className="h-5 w-5" />,
    CODE: <BookOpen className="h-5 w-5" />,
    ARRETE: <FileText className="h-5 w-5" />,
    JURISPRUDENCE: <Gavel className="h-5 w-5" />,
    TRAITE: <ScrollText className="h-5 w-5" />,
    CONVENTION: <ScrollText className="h-5 w-5" />,
};

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

const NATURES_FOR_STATS = CATEGORIES.map(c => c.nature);

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

    // Optimized: single useQueries for all nature counts
    const natureCounts = useQueries({
        queries: NATURES_FOR_STATS.map(nature => ({
            queryKey: queryKeys.lois.list({ nature, limit: 1 }),
            queryFn: () => fetchLois({ nature, limit: 1 }),
        })),
    });

    // Total count and in-force count
    const allTextes = useLois({ limit: 1 });
    const enVigueur = useLois({ limit: 1, etat: "VIGUEUR" });

    // Recent texts
    const recent = useLois({ limit: 6 });
    const recentTextes = recent.data?.data || [];

    const statsLoading = allTextes.isLoading || natureCounts.some(q => q.isLoading);
    const totalCount = allTextes.data?.pagination.total ?? 0;
    const enVigueurCount = enVigueur.data?.pagination.total ?? 0;
    const activeCategories = natureCounts.filter(q => (q.data?.pagination.total ?? 0) > 0).length;

    const getCountForNature = (nature: string): number | null => {
        const idx = NATURES_FOR_STATS.indexOf(nature);
        if (idx === -1) return null;
        return natureCounts[idx]?.data?.pagination.total ?? null;
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
                                    {enVigueur.isLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : enVigueurCount}
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

                        {recent.isLoading && (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <span className="ml-2 text-muted-foreground">Chargement...</span>
                            </div>
                        )}

                        {recent.isError && (
                            <div className="text-center py-12 text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Impossible de charger les textes recents.</p>
                                <p className="text-sm mt-1">Verifiez que le serveur backend est demarre.</p>
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
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {recentTextes.map((texte: Texte) => (
                                            <Link
                                                key={texte.id}
                                                href={`/lois/${texte.id}`}
                                                className="group border rounded-lg p-5 hover:border-primary hover:shadow-md transition-all bg-card block"
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
                                                            {texte.etat && ETAT_LABELS[texte.etat] && (
                                                                <span className={`text-xs font-medium px-2 py-0.5 rounded ${ETAT_STYLES[texte.etat] || ETAT_STYLES.VIGUEUR}`}>
                                                                    {ETAT_LABELS[texte.etat]}
                                                                </span>
                                                            )}
                                                            {texte.sousCategorie && (
                                                                <span className="text-xs font-medium px-2 py-0.5 bg-muted/60 rounded">
                                                                    {texte.sousCategorie}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h3 className="text-base font-semibold group-hover:text-primary transition-colors line-clamp-2">
                                                            {texte.titre}
                                                        </h3>
                                                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                                            {texte.numero && <span>N&deg; {texte.numero}</span>}
                                                            {texte.datePublication && (
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="h-3 w-3" />
                                                                    {formatDate(texte.datePublication)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
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
