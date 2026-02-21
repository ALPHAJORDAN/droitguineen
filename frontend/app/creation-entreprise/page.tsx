"use client";

import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { Button } from "@/components/ui/Button";
import { TexteCard } from "@/components/TexteCard";
import { LoadingState, EmptyState } from "@/components/ui/StateDisplay";
import { useLois } from "@/lib/hooks";
import { Texte } from "@/lib/api";
import Link from "next/link";
import {
    Briefcase, Building2, FileText, ArrowRight, CheckCircle,
    Scale, BookOpen, Users, Landmark, ClipboardList, BadgeCheck,
    Shield, HandCoins, Globe,
} from "lucide-react";

const FORMES_JURIDIQUES = [
    {
        nom: "Entreprise individuelle",
        capital: "Aucun minimum",
        associes: "1 personne",
        responsabilite: "Illimitee",
        avantages: "Simplicite de creation, gestion libre",
    },
    {
        nom: "SARL",
        capital: "100 000 GNF",
        associes: "1 a 100",
        responsabilite: "Limitee aux apports",
        avantages: "Forme la plus courante, souplesse de gestion",
    },
    {
        nom: "SA",
        capital: "10 000 000 GNF",
        associes: "Minimum 1",
        responsabilite: "Limitee aux apports",
        avantages: "Adaptee aux grandes entreprises, appel a l'epargne publique",
    },
    {
        nom: "SAS",
        capital: "Libre",
        associes: "Minimum 1",
        responsabilite: "Limitee aux apports",
        avantages: "Grande liberte statutaire",
    },
    {
        nom: "SNC",
        capital: "Libre",
        associes: "Minimum 2",
        responsabilite: "Illimitee et solidaire",
        avantages: "Confiance entre associes, pas de capital minimum",
    },
    {
        nom: "GIE",
        capital: "Libre",
        associes: "Minimum 2",
        responsabilite: "Illimitee et solidaire",
        avantages: "Mise en commun de moyens entre entreprises",
    },
];

const ETAPES = [
    {
        numero: 1,
        titre: "Choix de la forme juridique",
        description: "Determinez la structure adaptee a votre activite selon le capital disponible, le nombre d'associes et le niveau de responsabilite souhaite.",
        icon: <Scale className="h-5 w-5" />,
    },
    {
        numero: 2,
        titre: "Redaction des statuts",
        description: "Redigez les statuts de la societe conformement a l'AUSCGIE. Les statuts doivent etre notaries pour les SA.",
        icon: <FileText className="h-5 w-5" />,
    },
    {
        numero: 3,
        titre: "Depot du capital social",
        description: "Deposez le capital social sur un compte bancaire bloque au nom de la societe en formation.",
        icon: <HandCoins className="h-5 w-5" />,
    },
    {
        numero: 4,
        titre: "Enregistrement au greffe",
        description: "Deposez les statuts au greffe du tribunal de commerce competent pour enregistrement.",
        icon: <Landmark className="h-5 w-5" />,
    },
    {
        numero: 5,
        titre: "Immatriculation au RCCM",
        description: "Inscrivez la societe au Registre du Commerce et du Credit Mobilier pour obtenir le numero RCCM.",
        icon: <ClipboardList className="h-5 w-5" />,
    },
    {
        numero: 6,
        titre: "Obtention du NIF",
        description: "Obtenez le Numero d'Identification Fiscale aupres de la Direction Nationale des Impots.",
        icon: <BadgeCheck className="h-5 w-5" />,
    },
    {
        numero: 7,
        titre: "Declaration a la CNSS",
        description: "Declarez la societe et les salaries aupres de la Caisse Nationale de Securite Sociale.",
        icon: <Shield className="h-5 w-5" />,
    },
    {
        numero: 8,
        titre: "Publication legale",
        description: "Publiez un avis de constitution dans un journal d'annonces legales habilite.",
        icon: <Globe className="h-5 w-5" />,
    },
];

const ORGANISMES = [
    {
        nom: "APIP",
        description: "Agence de Promotion des Investissements Prives — Guichet unique pour la creation d'entreprise",
        icon: <Building2 className="h-6 w-6" />,
    },
    {
        nom: "Tribunal de Commerce",
        description: "Enregistrement des statuts et immatriculation au RCCM",
        icon: <Landmark className="h-6 w-6" />,
    },
    {
        nom: "Direction Nationale des Impots",
        description: "Delivrance du Numero d'Identification Fiscale (NIF)",
        icon: <BadgeCheck className="h-6 w-6" />,
    },
    {
        nom: "CNSS",
        description: "Caisse Nationale de Securite Sociale — Declaration employeurs et salaries",
        icon: <Users className="h-6 w-6" />,
    },
];

export default function CreationEntreprisePage() {
    const { data: ohadaData, isLoading } = useLois({
        nature: "ACTE_UNIFORME_OHADA",
        limit: 6,
        sort: "datePublication",
        order: "desc",
    });

    const ohadaTextes = ohadaData?.data ?? [];

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main id="main-content" className="flex-1">
                {/* Hero */}
                <section className="w-full bg-gradient-to-b from-accent/30 to-background border-b">
                    <div className="container px-4 md:px-6 py-16 md:py-24">
                        <div className="flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto">
                            <div className="p-4 bg-primary/10 rounded-2xl text-primary">
                                <Briefcase className="h-12 w-12" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                                Creer une entreprise <span className="text-primary">en Guinee</span>
                            </h1>
                            <p className="text-muted-foreground text-lg max-w-2xl">
                                Guide pratique pour creer votre entreprise : formes juridiques,
                                demarches administratives, organismes et textes de reference OHADA.
                            </p>
                            <div className="flex gap-3">
                                <a href="#formes-juridiques">
                                    <Button className="gap-2">
                                        <Scale className="h-4 w-4" />
                                        Formes juridiques
                                    </Button>
                                </a>
                                <a href="#etapes">
                                    <Button variant="outline" className="gap-2">
                                        <ClipboardList className="h-4 w-4" />
                                        Etapes de creation
                                    </Button>
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Formes juridiques */}
                <section id="formes-juridiques" className="w-full py-16 bg-background">
                    <div className="container px-4 md:px-6">
                        <div className="text-center mb-10">
                            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Formes juridiques</h2>
                            <p className="mt-2 text-muted-foreground">
                                Comparez les differentes structures d&apos;entreprise prevues par l&apos;AUSCGIE
                            </p>
                        </div>

                        {/* Desktop table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full border-collapse border rounded-lg text-sm">
                                <thead>
                                    <tr className="bg-muted/50">
                                        <th className="border p-3 text-left font-semibold">Forme</th>
                                        <th className="border p-3 text-left font-semibold">Capital minimum</th>
                                        <th className="border p-3 text-left font-semibold">Associes</th>
                                        <th className="border p-3 text-left font-semibold">Responsabilite</th>
                                        <th className="border p-3 text-left font-semibold">Avantages</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {FORMES_JURIDIQUES.map((forme) => (
                                        <tr key={forme.nom} className="hover:bg-muted/30 transition-colors">
                                            <td className="border p-3 font-medium">{forme.nom}</td>
                                            <td className="border p-3">{forme.capital}</td>
                                            <td className="border p-3">{forme.associes}</td>
                                            <td className="border p-3">{forme.responsabilite}</td>
                                            <td className="border p-3 text-muted-foreground">{forme.avantages}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="md:hidden space-y-4">
                            {FORMES_JURIDIQUES.map((forme) => (
                                <div key={forme.nom} className="border rounded-lg p-4 bg-card">
                                    <h3 className="font-semibold mb-3">{forme.nom}</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Capital min.</span>
                                            <span className="font-medium">{forme.capital}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Associes</span>
                                            <span className="font-medium">{forme.associes}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Responsabilite</span>
                                            <span className="font-medium">{forme.responsabilite}</span>
                                        </div>
                                        <p className="text-muted-foreground text-xs mt-2 pt-2 border-t">{forme.avantages}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Etapes de creation */}
                <section id="etapes" className="w-full py-16 bg-muted/20 border-t">
                    <div className="container px-4 md:px-6">
                        <div className="text-center mb-10">
                            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Etapes de creation</h2>
                            <p className="mt-2 text-muted-foreground">
                                Les 8 demarches pour immatriculer votre entreprise
                            </p>
                        </div>

                        <div className="max-w-3xl mx-auto space-y-0">
                            {ETAPES.map((etape, index) => (
                                <div key={etape.numero} className="flex gap-4">
                                    {/* Timeline */}
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-sm flex-shrink-0">
                                            {etape.numero}
                                        </div>
                                        {index < ETAPES.length - 1 && (
                                            <div className="w-0.5 flex-1 bg-primary/20 my-1" />
                                        )}
                                    </div>
                                    {/* Content */}
                                    <div className="pb-8 flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-primary">{etape.icon}</span>
                                            <h3 className="font-semibold">{etape.titre}</h3>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{etape.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Organismes utiles */}
                <section className="w-full py-16 bg-background border-t">
                    <div className="container px-4 md:px-6">
                        <div className="text-center mb-10">
                            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Organismes utiles</h2>
                            <p className="mt-2 text-muted-foreground">
                                Les institutions a contacter pour vos demarches
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {ORGANISMES.map((org) => (
                                <div
                                    key={org.nom}
                                    className="flex flex-col items-center text-center p-6 border rounded-2xl bg-card space-y-3"
                                >
                                    <div className="p-3 bg-primary/10 rounded-full text-primary">
                                        {org.icon}
                                    </div>
                                    <h3 className="font-semibold">{org.nom}</h3>
                                    <p className="text-sm text-muted-foreground">{org.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Textes OHADA de reference */}
                <section className="w-full py-16 bg-muted/20 border-t">
                    <div className="container px-4 md:px-6">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Textes OHADA de reference</h2>
                                <p className="mt-1 text-muted-foreground">
                                    Les Actes Uniformes encadrant la creation et la vie des entreprises
                                </p>
                            </div>
                            <Link href="/ohada">
                                <Button variant="outline" className="hidden sm:inline-flex gap-2">
                                    Voir tout <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>

                        {/* Key references */}
                        <div className="grid gap-4 md:grid-cols-3 mb-8">
                            <div className="border rounded-lg p-5 bg-card">
                                <div className="flex items-center gap-3 mb-2">
                                    <BookOpen className="h-5 w-5 text-primary" />
                                    <h3 className="font-semibold text-sm">AUSCGIE</h3>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Acte Uniforme sur les Societes Commerciales et le Groupement d&apos;Interet Economique — regit la creation, le fonctionnement et la dissolution des societes.
                                </p>
                            </div>
                            <div className="border rounded-lg p-5 bg-card">
                                <div className="flex items-center gap-3 mb-2">
                                    <BookOpen className="h-5 w-5 text-primary" />
                                    <h3 className="font-semibold text-sm">AUDCG</h3>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Acte Uniforme sur le Droit Commercial General — definit le statut du commercant, le RCCM et les obligations commerciales.
                                </p>
                            </div>
                            <div className="border rounded-lg p-5 bg-card">
                                <div className="flex items-center gap-3 mb-2">
                                    <BookOpen className="h-5 w-5 text-primary" />
                                    <h3 className="font-semibold text-sm">AUDCIF</h3>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Acte Uniforme sur le Droit Comptable et l&apos;Information Financiere — normes comptables obligatoires pour toutes les entreprises.
                                </p>
                            </div>
                        </div>

                        {/* Dynamic OHADA texts */}
                        {isLoading && <LoadingState message="Chargement des textes..." />}

                        {!isLoading && ohadaTextes.length === 0 && (
                            <EmptyState
                                title="Aucun texte OHADA disponible"
                                description="Les textes OHADA seront bientot ajoutes a la plateforme."
                            />
                        )}

                        {!isLoading && ohadaTextes.length > 0 && (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {ohadaTextes.map((texte: Texte) => (
                                    <TexteCard key={texte.id} texte={texte} compact />
                                ))}
                            </div>
                        )}

                        <div className="text-center mt-6 sm:hidden">
                            <Link href="/ohada">
                                <Button variant="outline" className="gap-2">
                                    Voir les textes OHADA <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
