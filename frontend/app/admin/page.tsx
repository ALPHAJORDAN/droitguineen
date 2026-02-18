"use client";

import { Suspense } from "react";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { Button } from "@/components/ui/Button";
import { useFiles, useDeleteFile, useUploadPdf } from "@/lib/hooks";
import { useAuth } from "@/lib/auth";
import { FileData } from "@/lib/api";
import {
    Trash2, FileText, UploadCloud, RefreshCw, AlertCircle, CheckCircle, Loader2,
    Scale, Building2, Gavel, ScrollText, BookOpen, FileCheck, Info, ChevronDown, Eye, ShieldAlert
} from "lucide-react";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ============ Hiérarchie juridique complète de la Guinée ============

interface DocumentCategory {
    label: string;
    nature: string;
    icon: React.ReactNode;
    description: string;
    subtypes: { value: string; label: string; description?: string }[];
    fields: {
        numero?: { prefix: string; format: string; placeholder: string };
        showVisas?: boolean;
        showSignataires?: boolean;
        showJO?: boolean;
        showDateEntreeVigueur?: boolean;
    };
}

const HIERARCHIE_JURIDIQUE: Record<string, DocumentCategory> = {
    "CONSTITUTION": {
        label: "Constitution",
        nature: "LOI_CONSTITUTIONNELLE",
        icon: <Scale className="h-5 w-5" />,
        description: "Loi fondamentale de la République de Guinée",
        subtypes: [
            { value: "texte_integral", label: "Texte intégral", description: "Constitution complète" },
            { value: "revision", label: "Révision constitutionnelle", description: "Modification de la Constitution" },
            { value: "preambule", label: "Préambule", description: "Préambule de la Constitution" },
        ],
        fields: {
            numero: { prefix: "", format: "Année", placeholder: "Ex: 2010" },
            showVisas: true,
            showSignataires: true,
            showJO: true,
            showDateEntreeVigueur: true,
        }
    },
    "LOI_ORGANIQUE": {
        label: "Loi organique",
        nature: "LOI_ORGANIQUE",
        icon: <Building2 className="h-5 w-5" />,
        description: "Loi relative à l'organisation des pouvoirs publics",
        subtypes: [
            { value: "organisation_pouvoirs", label: "Organisation des pouvoirs", description: "Fonctionnement des institutions" },
            { value: "elections", label: "Élections", description: "Code électoral et scrutins" },
            { value: "justice", label: "Organisation judiciaire", description: "Fonctionnement de la justice" },
            { value: "collectivites", label: "Collectivités locales", description: "Décentralisation" },
            { value: "finances", label: "Loi organique financière", description: "Finances publiques" },
        ],
        fields: {
            numero: { prefix: "L/", format: "L/AAAA/NNN/AN", placeholder: "Ex: L/2024/001/AN" },
            showVisas: true,
            showSignataires: true,
            showJO: true,
            showDateEntreeVigueur: true,
        }
    },
    "LOI": {
        label: "Loi ordinaire",
        nature: "LOI",
        icon: <ScrollText className="h-5 w-5" />,
        description: "Loi votée par l'Assemblée Nationale",
        subtypes: [
            { value: "ordinaire", label: "Loi ordinaire", description: "Loi de droit commun" },
            { value: "finances", label: "Loi de finances", description: "Budget annuel de l'État" },
            { value: "finances_rectificative", label: "Loi de finances rectificative", description: "Modification budgétaire" },
            { value: "reglement", label: "Loi de règlement", description: "Exécution budgétaire" },
            { value: "autorisation", label: "Loi d'autorisation", description: "Autorisation de ratification" },
            { value: "habilitation", label: "Loi d'habilitation", description: "Habilitation à légiférer par ordonnance" },
            { value: "programmation", label: "Loi de programmation", description: "Planification pluriannuelle" },
            { value: "amnistie", label: "Loi d'amnistie", description: "Amnistie" },
        ],
        fields: {
            numero: { prefix: "L/", format: "L/AAAA/NNN/AN", placeholder: "Ex: L/2024/015/AN" },
            showVisas: true,
            showSignataires: true,
            showJO: true,
            showDateEntreeVigueur: true,
        }
    },
    "ORDONNANCE": {
        label: "Ordonnance",
        nature: "ORDONNANCE",
        icon: <Gavel className="h-5 w-5" />,
        description: "Acte pris par le Président dans le domaine de la loi",
        subtypes: [
            { value: "habilitation", label: "Sur habilitation", description: "Prise sur habilitation parlementaire" },
            { value: "article_60", label: "Article 60", description: "Ordonnance présidentielle" },
            { value: "transition", label: "Période de transition", description: "Ordonnance de transition" },
            { value: "ratifiee", label: "Ordonnance ratifiée", description: "Ratifiée par le Parlement" },
        ],
        fields: {
            numero: { prefix: "O/", format: "O/AAAA/NNN/PRG", placeholder: "Ex: O/2024/005/PRG" },
            showVisas: true,
            showSignataires: true,
            showJO: true,
            showDateEntreeVigueur: true,
        }
    },
    "DECRET": {
        label: "Décret",
        nature: "DECRET",
        icon: <FileCheck className="h-5 w-5" />,
        description: "Acte réglementaire du pouvoir exécutif",
        subtypes: [
            { value: "presidentiel", label: "Décret présidentiel", description: "Signé par le Président" },
            { value: "pm", label: "Décret du Premier Ministre", description: "Signé par le PM" },
            { value: "application", label: "Décret d'application", description: "Application d'une loi" },
            { value: "nomination", label: "Décret de nomination", description: "Nomination de personnalités" },
            { value: "organisation", label: "Décret d'organisation", description: "Organisation administrative" },
            { value: "reglementaire", label: "Décret réglementaire", description: "Mesures réglementaires" },
            { value: "individuel", label: "Décret individuel", description: "Mesure individuelle" },
            { value: "conseil_ministres", label: "Décret en Conseil des Ministres", description: "Délibéré en Conseil" },
        ],
        fields: {
            numero: { prefix: "D/", format: "D/AAAA/NNN/PRG", placeholder: "Ex: D/2024/123/PRG" },
            showVisas: true,
            showSignataires: true,
            showJO: true,
            showDateEntreeVigueur: true,
        }
    },
    "ARRETE": {
        label: "Arrêté",
        nature: "ARRETE",
        icon: <FileText className="h-5 w-5" />,
        description: "Acte administratif unilatéral",
        subtypes: [
            { value: "ministeriel", label: "Arrêté ministériel", description: "Signé par un ministre" },
            { value: "interministeriel", label: "Arrêté interministériel", description: "Signé par plusieurs ministres" },
            { value: "conjoint", label: "Arrêté conjoint", description: "Arrêté conjoint" },
            { value: "prefectoral", label: "Arrêté préfectoral", description: "Signé par un préfet" },
            { value: "gouverneur", label: "Arrêté du gouverneur", description: "Signé par un gouverneur" },
            { value: "maire", label: "Arrêté municipal", description: "Signé par un maire" },
        ],
        fields: {
            numero: { prefix: "A/", format: "A/AAAA/NNN/MIN", placeholder: "Ex: A/2024/045/MJ" },
            showVisas: true,
            showSignataires: true,
            showJO: false,
        }
    },
    "CIRCULAIRE": {
        label: "Circulaire",
        nature: "CIRCULAIRE",
        icon: <FileText className="h-5 w-5" />,
        description: "Instruction administrative interne",
        subtypes: [
            { value: "interpretative", label: "Circulaire interprétative", description: "Interprétation de textes" },
            { value: "instruction", label: "Instruction", description: "Instructions aux services" },
            { value: "note", label: "Note de service", description: "Note interne" },
        ],
        fields: {
            numero: { prefix: "C/", format: "C/AAAA/NNN", placeholder: "Ex: C/2024/012" },
            showVisas: false,
            showSignataires: true,
            showJO: false,
        }
    },
    "CODE": {
        label: "Code",
        nature: "CODE",
        icon: <BookOpen className="h-5 w-5" />,
        description: "Recueil de lois organisé par matière",
        subtypes: [
            { value: "civil", label: "Code civil", description: "Droit civil" },
            { value: "penal", label: "Code pénal", description: "Droit pénal" },
            { value: "procedure_civile", label: "Code de procédure civile", description: "Procédure civile" },
            { value: "procedure_penale", label: "Code de procédure pénale", description: "Procédure pénale" },
            { value: "travail", label: "Code du travail", description: "Droit du travail" },
            { value: "commerce", label: "Code de commerce", description: "Droit commercial" },
            { value: "famille", label: "Code de la famille", description: "Droit de la famille" },
            { value: "foncier", label: "Code foncier", description: "Droit foncier" },
            { value: "environnement", label: "Code de l'environnement", description: "Droit de l'environnement" },
            { value: "minier", label: "Code minier", description: "Exploitation minière" },
            { value: "investissements", label: "Code des investissements", description: "Investissements" },
            { value: "douanes", label: "Code des douanes", description: "Douanes" },
            { value: "impots", label: "Code général des impôts", description: "Fiscalité" },
            { value: "securite_sociale", label: "Code de sécurité sociale", description: "Protection sociale" },
            { value: "maritime", label: "Code maritime", description: "Droit maritime" },
            { value: "electoral", label: "Code électoral", description: "Élections" },
            { value: "collectivites", label: "Code des collectivités", description: "Collectivités locales" },
        ],
        fields: {
            numero: { prefix: "", format: "Titre", placeholder: "Ex: Code civil de Guinée" },
            showVisas: true,
            showSignataires: true,
            showJO: true,
            showDateEntreeVigueur: true,
        }
    },
    "TRAITE": {
        label: "Traité / Convention",
        nature: "TRAITE",
        icon: <Scale className="h-5 w-5" />,
        description: "Accord international",
        subtypes: [
            { value: "bilateral", label: "Traité bilatéral", description: "Entre deux États" },
            { value: "multilateral", label: "Traité multilatéral", description: "Entre plusieurs États" },
            { value: "convention", label: "Convention internationale", description: "Convention" },
            { value: "accord", label: "Accord", description: "Accord international" },
            { value: "protocole", label: "Protocole", description: "Protocole additionnel" },
        ],
        fields: {
            numero: { prefix: "", format: "Titre complet", placeholder: "Ex: Convention de..." },
            showVisas: true,
            showSignataires: true,
            showJO: true,
            showDateEntreeVigueur: true,
        }
    },
    "DECISION": {
        label: "Décision",
        nature: "DECISION",
        icon: <Gavel className="h-5 w-5" />,
        description: "Décision administrative ou juridictionnelle",
        subtypes: [
            { value: "cour_constitutionnelle", label: "Cour constitutionnelle", description: "Décision CC" },
            { value: "cour_supreme", label: "Cour suprême", description: "Décision CS" },
            { value: "conseil_etat", label: "Conseil d'État", description: "Décision CE" },
            { value: "administrative", label: "Décision administrative", description: "Décision admin" },
        ],
        fields: {
            numero: { prefix: "", format: "N° décision", placeholder: "Ex: DCC-2024-001" },
            showVisas: true,
            showSignataires: true,
            showJO: false,
        }
    },
    "JURISPRUDENCE": {
        label: "Jurisprudence",
        nature: "JURISPRUDENCE",
        icon: <Gavel className="h-5 w-5" />,
        description: "Décision de justice faisant autorité",
        subtypes: [
            { value: "cour_constitutionnelle", label: "Cour constitutionnelle", description: "Jurisprudence CC" },
            { value: "cour_supreme", label: "Cour suprême", description: "Jurisprudence CS" },
            { value: "cour_appel", label: "Cour d'appel", description: "Jurisprudence CA" },
            { value: "tribunal", label: "Tribunal", description: "Jurisprudence TPI/TGI" },
        ],
        fields: {
            numero: { prefix: "", format: "Référence", placeholder: "Ex: Arrêt n°..." },
            showVisas: false,
            showSignataires: true,
            showJO: false,
        }
    },
};

// Liste des ministères et institutions
const AUTORITES_SIGNATAIRES = [
    "Président de la République",
    "Premier Ministre",
    "Ministre de la Justice",
    "Ministre de l'Économie et des Finances",
    "Ministre de l'Intérieur et de la Sécurité",
    "Ministre de la Défense Nationale",
    "Ministre des Affaires Étrangères",
    "Ministre de l'Éducation Nationale",
    "Ministre de la Santé",
    "Ministre de l'Agriculture",
    "Ministre des Mines et de la Géologie",
    "Ministre de l'Environnement",
    "Ministre du Travail",
    "Ministre de la Fonction Publique",
    "Ministre du Commerce",
    "Ministre de l'Industrie",
    "Ministre des Transports",
    "Ministre de la Communication",
    "Ministre de la Culture",
    "Ministre de la Jeunesse et des Sports",
    "Ministre de l'Urbanisme et de l'Habitat",
    "Ministre de l'Énergie et de l'Hydraulique",
    "Ministre des Postes et Télécommunications",
    "Ministre du Tourisme",
    "Secrétaire Général du Gouvernement",
    "Président de l'Assemblée Nationale",
    "Président de la Cour Constitutionnelle",
    "Président de la Cour Suprême",
    "Gouverneur de la BCRG",
];

// États possibles du texte
const ETATS_TEXTE = [
    { value: "VIGUEUR", label: "En vigueur", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
    { value: "VIGUEUR_DIFF", label: "En vigueur différée", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
    { value: "MODIFIE", label: "Modifié", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
    { value: "ABROGE", label: "Abrogé", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
    { value: "ABROGE_DIFF", label: "Abrogé différé", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
    { value: "PERIME", label: "Périmé", color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400" },
];

export default function AdminPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <AdminPageContent />
        </Suspense>
    );
}

function AdminPageContent() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [showAdvanced, setShowAdvanced] = useState(false);
    
    const [uploadForm, setUploadForm] = useState({
        // Étape 1 : Classification
        categorie: "LOI" as keyof typeof HIERARCHIE_JURIDIQUE,
        sousType: "",
        
        // Étape 2 : Identification
        titre: "",
        titreComplet: "",
        numero: "",
        nor: "",
        eli: "",
        
        // Étape 3 : Dates
        dateSignature: "",
        datePublication: "",
        dateEntreeVigueur: "",
        dateAbrogation: "",
        
        // Étape 4 : Métadonnées
        etat: "VIGUEUR",
        visas: "",
        signataires: [] as string[],
        sourceJO: "",
        urlJO: "",
        
        // Fichier
        file: null as File | null,
    });

    // React Query hooks
    const { data: files = [], isLoading, refetch } = useFiles();
    const deleteFileMutation = useDeleteFile();
    const uploadMutation = useUploadPdf();

    const currentCategory = HIERARCHIE_JURIDIQUE[uploadForm.categorie];

    async function handleDelete(id: string) {
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce fichier ? Cette action est irréversible.")) {
            return;
        }
        deleteFileMutation.mutate(id);
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setUploadForm(prev => ({ ...prev, file: e.target.files![0] }));
        }
    };

    const handleUploadSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!uploadForm.file) return;

        try {
            await uploadMutation.mutateAsync({
                file: uploadForm.file,
                metadata: {
                    titre: uploadForm.titre || uploadForm.titreComplet,
                    nature: currentCategory.nature,
                    sousCategorie: uploadForm.sousType || undefined,
                    dateSignature: uploadForm.dateSignature || undefined,
                    datePublication: uploadForm.datePublication || undefined,
                },
            });
            setIsUploadModalOpen(false);
            resetForm();
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Erreur lors de l'upload. Veuillez réessayer.");
        }
    };

    const resetForm = () => {
        setUploadForm({
            categorie: "LOI",
            sousType: "",
            titre: "",
            titreComplet: "",
            numero: "",
            nor: "",
            eli: "",
            dateSignature: "",
            datePublication: "",
            dateEntreeVigueur: "",
            dateAbrogation: "",
            etat: "VIGUEUR",
            visas: "",
            signataires: [],
            sourceJO: "",
            urlJO: "",
            file: null,
        });
        setCurrentStep(1);
        setShowAdvanced(false);
    };

    const toggleSignataire = (signataire: string) => {
        setUploadForm(prev => ({
            ...prev,
            signataires: prev.signataires.includes(signataire)
                ? prev.signataires.filter(s => s !== signataire)
                : [...prev.signataires, signataire]
        }));
    };

    const canProceed = () => {
        switch (currentStep) {
            case 1: return uploadForm.categorie;
            case 2: return uploadForm.titre || uploadForm.file;
            case 3: return true;
            default: return true;
        }
    };

    // Auth guard - loading
    if (authLoading) {
        return (
            <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </main>
                <Footer />
            </div>
        );
    }

    // Auth guard - unauthorized
    if (!isAuthenticated || !['ADMIN', 'EDITOR'].includes(user?.role || '')) {
        return (
            <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center px-4">
                    <div className="text-center space-y-4 max-w-md">
                        <ShieldAlert className="h-16 w-16 mx-auto text-muted-foreground" />
                        <h1 className="text-2xl font-bold">Accès restreint</h1>
                        <p className="text-muted-foreground">
                            Vous devez être connecté avec un compte administrateur ou éditeur pour accéder à cette page.
                        </p>
                        <Button onClick={() => router.push('/login?redirect=/admin')}>
                            Se connecter
                        </Button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 container py-8 px-4 md:px-6">
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 space-y-4 md:space-y-0">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
                        <p className="text-muted-foreground">Gérez les documents et les contenus de la plateforme.</p>
                    </div>
                    <div>
                        <Button onClick={() => setIsUploadModalOpen(true)}>
                            <UploadCloud className="mr-2 h-4 w-4" />
                            Importer un nouveau document
                        </Button>
                    </div>
                </div>

                <div className="bg-card border rounded-lg shadow-sm">
                    <div className="p-6 border-b flex items-center justify-between">
                        <h2 className="font-semibold text-lg flex items-center">
                            <FileText className="mr-2 h-5 w-5 text-primary" />
                            Fichiers Chargés
                        </h2>
                        <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isLoading}>
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>

                    <div className="divide-y">
                        {isLoading ? (
                            <div className="p-8 text-center text-muted-foreground flex items-center justify-center">
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                Chargement des fichiers...
                            </div>
                        ) : files.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Aucun fichier trouvé.</p>
                                <p className="text-sm mt-1">Importez votre premier document PDF.</p>
                            </div>
                        ) : (
                            files.map((file: FileData) => (
                                <div key={file.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-start space-x-4">
                                        <div className="p-2 bg-primary/10 rounded">
                                            <FileText className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <Link href={`/lois/${file.id}`}>
                                                <h3 className="font-medium text-base hover:text-primary transition-colors cursor-pointer">{file.name}</h3>
                                            </Link>
                                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
                                                <span>{file.type}</span>
                                                <span>•</span>
                                                <span>{file.size}</span>
                                                <span>•</span>
                                                <span>{file.uploadDate}</span>
                                                <span>•</span>
                                                <StatusBadge status={file.status} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Link href={`/lois/${file.id}`}>
                                            <Button variant="outline" size="sm">
                                                <Eye className="h-4 w-4 mr-2" />
                                                Voir
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(file.id)}
                                            disabled={deleteFileMutation.isPending}
                                        >
                                            {deleteFileMutation.isPending ? (
                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Supprimer
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Upload Modal Amélioré */}
                {isUploadModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                            {/* Header */}
                            <div className="px-6 py-4 border-b bg-muted/30">
                                <h2 className="text-xl font-semibold flex items-center">
                                    <UploadCloud className="mr-2 h-5 w-5 text-primary" />
                                    Importer un document juridique
                                </h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Renseignez les informations du document selon la hiérarchie des normes
                                </p>
                            </div>

                            {/* Progress Steps */}
                            <div className="px-6 py-3 border-b bg-muted/10">
                                <div className="flex items-center justify-between max-w-2xl mx-auto">
                                    {[
                                        { num: 1, label: "Classification" },
                                        { num: 2, label: "Identification" },
                                        { num: 3, label: "Dates & État" },
                                        { num: 4, label: "Fichier" },
                                    ].map((step, index) => (
                                        <div key={step.num} className="flex items-center">
                                            <button
                                                onClick={() => setCurrentStep(step.num)}
                                                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                                                    currentStep === step.num
                                                        ? "bg-primary text-primary-foreground"
                                                        : currentStep > step.num
                                                        ? "bg-green-500 text-white"
                                                        : "bg-muted text-muted-foreground"
                                                }`}
                                            >
                                                {currentStep > step.num ? <CheckCircle className="h-4 w-4" /> : step.num}
                                            </button>
                                            <span className={`ml-2 text-sm hidden sm:block ${
                                                currentStep === step.num ? "font-medium" : "text-muted-foreground"
                                            }`}>
                                                {step.label}
                                            </span>
                                            {index < 3 && (
                                                <div className={`w-12 h-0.5 mx-2 ${
                                                    currentStep > step.num ? "bg-green-500" : "bg-muted"
                                                }`} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Form Content */}
                            <form onSubmit={handleUploadSubmit} className="flex-1 overflow-y-auto">
                                <div className="p-6 space-y-6">
                                    
                                    {/* Étape 1: Classification */}
                                    {currentStep === 1 && (
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="text-lg font-medium mb-4">Type de document juridique</h3>
                                                <p className="text-sm text-muted-foreground mb-4">
                                                    Sélectionnez la catégorie du document selon la hiérarchie des normes guinéennes
                                                </p>
                                                
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {Object.entries(HIERARCHIE_JURIDIQUE).map(([key, cat]) => (
                                                        <button
                                                            key={key}
                                                            type="button"
                                                            onClick={() => setUploadForm(prev => ({ ...prev, categorie: key as keyof typeof HIERARCHIE_JURIDIQUE, sousType: "" }))}
                                                            className={`p-4 border rounded-lg text-left transition-all hover:border-primary/50 ${
                                                                uploadForm.categorie === key
                                                                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                                                    : "hover:bg-muted/50"
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`p-2 rounded-lg ${
                                                                    uploadForm.categorie === key 
                                                                        ? "bg-primary text-primary-foreground" 
                                                                        : "bg-muted"
                                                                }`}>
                                                                    {cat.icon}
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium">{cat.label}</div>
                                                                    <div className="text-xs text-muted-foreground line-clamp-1">
                                                                        {cat.description}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {currentCategory?.subtypes.length > 0 && (
                                                <div>
                                                    <h3 className="text-lg font-medium mb-4">Sous-catégorie</h3>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                        {currentCategory.subtypes.map((subtype) => (
                                                            <button
                                                                key={subtype.value}
                                                                type="button"
                                                                onClick={() => setUploadForm(prev => ({ ...prev, sousType: subtype.value }))}
                                                                className={`p-3 border rounded-lg text-left transition-all ${
                                                                    uploadForm.sousType === subtype.value
                                                                        ? "border-primary bg-primary/5"
                                                                        : "hover:bg-muted/50"
                                                                }`}
                                                            >
                                                                <div className="font-medium text-sm">{subtype.label}</div>
                                                                {subtype.description && (
                                                                    <div className="text-xs text-muted-foreground mt-0.5">
                                                                        {subtype.description}
                                                                    </div>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Étape 2: Identification */}
                                    {currentStep === 2 && (
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="text-lg font-medium mb-4">Identification du texte</h3>
                                                
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="text-sm font-medium mb-1.5 block">
                                                            Titre court <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            required
                                                            className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                                            placeholder={`Ex: ${currentCategory?.label} ${currentCategory?.fields.numero?.placeholder || ""}`}
                                                            value={uploadForm.titre}
                                                            onChange={e => setUploadForm({ ...uploadForm, titre: e.target.value })}
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-sm font-medium mb-1.5 block">
                                                            Titre complet / Objet
                                                        </label>
                                                        <textarea
                                                            rows={2}
                                                            className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
                                                            placeholder="Titre complet du document incluant l'objet..."
                                                            value={uploadForm.titreComplet}
                                                            onChange={e => setUploadForm({ ...uploadForm, titreComplet: e.target.value })}
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="text-sm font-medium mb-1.5 block">
                                                                Numéro du texte
                                                            </label>
                                                            <div className="relative">
                                                                <input
                                                                    type="text"
                                                                    className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                                                    placeholder={currentCategory?.fields.numero?.placeholder || "Ex: 2024/001"}
                                                                    value={uploadForm.numero}
                                                                    onChange={e => setUploadForm({ ...uploadForm, numero: e.target.value })}
                                                                />
                                                                {currentCategory?.fields.numero?.format && (
                                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                                                            {currentCategory.fields.numero.format}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <label className="text-sm font-medium mb-1.5 block">
                                                                État du texte
                                                            </label>
                                                            <select
                                                                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                                                value={uploadForm.etat}
                                                                onChange={e => setUploadForm({ ...uploadForm, etat: e.target.value })}
                                                            >
                                                                {ETATS_TEXTE.map(etat => (
                                                                    <option key={etat.value} value={etat.value}>
                                                                        {etat.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {/* Champs avancés */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowAdvanced(!showAdvanced)}
                                                        className="flex items-center text-sm text-primary hover:underline"
                                                    >
                                                        <ChevronDown className={`h-4 w-4 mr-1 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
                                                        Identifiants avancés (NOR, ELI)
                                                    </button>

                                                    {showAdvanced && (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                                                            <div>
                                                                <label className="text-sm font-medium mb-1.5 block flex items-center">
                                                                    Numéro NOR
                                                                    <span className="ml-1 text-muted-foreground" title="Numéro d'Ordre - Identifiant unique">
                                                                        <Info className="h-3 w-3" />
                                                                    </span>
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background"
                                                                    placeholder="Ex: JUSC2312345A"
                                                                    value={uploadForm.nor}
                                                                    onChange={e => setUploadForm({ ...uploadForm, nor: e.target.value.toUpperCase() })}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-sm font-medium mb-1.5 block flex items-center">
                                                                    Identifiant ELI
                                                                    <span className="ml-1 text-muted-foreground" title="European Legislation Identifier">
                                                                        <Info className="h-3 w-3" />
                                                                    </span>
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background"
                                                                    placeholder="Ex: eli/loi/2024/123"
                                                                    value={uploadForm.eli}
                                                                    onChange={e => setUploadForm({ ...uploadForm, eli: e.target.value.toLowerCase() })}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Étape 3: Dates & Métadonnées */}
                                    {currentStep === 3 && (
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="text-lg font-medium mb-4">Dates importantes</h3>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-sm font-medium mb-1.5 block">
                                                            Date de signature
                                                        </label>
                                                        <input
                                                            type="date"
                                                            className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                                            value={uploadForm.dateSignature}
                                                            onChange={e => setUploadForm({ ...uploadForm, dateSignature: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium mb-1.5 block">
                                                            Date de publication (JO)
                                                        </label>
                                                        <input
                                                            type="date"
                                                            className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                                            value={uploadForm.datePublication}
                                                            onChange={e => setUploadForm({ ...uploadForm, datePublication: e.target.value })}
                                                        />
                                                    </div>
                                                    {currentCategory?.fields.showDateEntreeVigueur && (
                                                        <div>
                                                            <label className="text-sm font-medium mb-1.5 block">
                                                                Date d&apos;entrée en vigueur
                                                            </label>
                                                            <input
                                                                type="date"
                                                                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                                                value={uploadForm.dateEntreeVigueur}
                                                                onChange={e => setUploadForm({ ...uploadForm, dateEntreeVigueur: e.target.value })}
                                                            />
                                                        </div>
                                                    )}
                                                    {uploadForm.etat === "ABROGE" && (
                                                        <div>
                                                            <label className="text-sm font-medium mb-1.5 block">
                                                                Date d&apos;abrogation
                                                            </label>
                                                            <input
                                                                type="date"
                                                                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                                                value={uploadForm.dateAbrogation}
                                                                onChange={e => setUploadForm({ ...uploadForm, dateAbrogation: e.target.value })}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {currentCategory?.fields.showJO && (
                                                <div>
                                                    <h3 className="text-lg font-medium mb-4">Journal Officiel</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="text-sm font-medium mb-1.5 block">
                                                                Référence JO
                                                            </label>
                                                            <input
                                                                type="text"
                                                                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background"
                                                                placeholder="Ex: JO n°2024-15 du 15/03/2024"
                                                                value={uploadForm.sourceJO}
                                                                onChange={e => setUploadForm({ ...uploadForm, sourceJO: e.target.value })}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-sm font-medium mb-1.5 block">
                                                                URL du JO (optionnel)
                                                            </label>
                                                            <input
                                                                type="url"
                                                                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background"
                                                                placeholder="https://..."
                                                                value={uploadForm.urlJO}
                                                                onChange={e => setUploadForm({ ...uploadForm, urlJO: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {currentCategory?.fields.showSignataires && (
                                                <div>
                                                    <h3 className="text-lg font-medium mb-4">Signataires</h3>
                                                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-3 border rounded-lg bg-muted/20">
                                                        {AUTORITES_SIGNATAIRES.map(signataire => (
                                                            <button
                                                                key={signataire}
                                                                type="button"
                                                                onClick={() => toggleSignataire(signataire)}
                                                                className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                                                                    uploadForm.signataires.includes(signataire)
                                                                        ? "bg-primary text-primary-foreground border-primary"
                                                                        : "bg-background hover:bg-muted"
                                                                }`}
                                                            >
                                                                {signataire}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    {uploadForm.signataires.length > 0 && (
                                                        <p className="text-xs text-muted-foreground mt-2">
                                                            {uploadForm.signataires.length} signataire(s) sélectionné(s)
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {currentCategory?.fields.showVisas && (
                                                <div>
                                                    <h3 className="text-lg font-medium mb-4">Visas</h3>
                                                    <textarea
                                                        rows={4}
                                                        className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
                                                        placeholder="Vu la Constitution...&#10;Vu la loi n°...&#10;Vu le décret n°..."
                                                        value={uploadForm.visas}
                                                        onChange={e => setUploadForm({ ...uploadForm, visas: e.target.value })}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Étape 4: Fichier */}
                                    {currentStep === 4 && (
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="text-lg font-medium mb-4">Fichier PDF</h3>
                                                
                                                {/* Récapitulatif */}
                                                <div className="bg-muted/30 rounded-lg p-4 mb-6">
                                                    <h4 className="font-medium mb-3 flex items-center">
                                                        <FileCheck className="h-4 w-4 mr-2 text-primary" />
                                                        Récapitulatif du document
                                                    </h4>
                                                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                                        <div>
                                                            <span className="text-muted-foreground">Type :</span>
                                                            <span className="ml-2 font-medium">{currentCategory?.label}</span>
                                                        </div>
                                                        {uploadForm.sousType && (
                                                            <div>
                                                                <span className="text-muted-foreground">Sous-type :</span>
                                                                <span className="ml-2 font-medium">
                                                                    {currentCategory?.subtypes.find(s => s.value === uploadForm.sousType)?.label}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className="col-span-2">
                                                            <span className="text-muted-foreground">Titre :</span>
                                                            <span className="ml-2 font-medium">{uploadForm.titre || "(non renseigné)"}</span>
                                                        </div>
                                                        {uploadForm.numero && (
                                                            <div>
                                                                <span className="text-muted-foreground">Numéro :</span>
                                                                <span className="ml-2 font-medium">{uploadForm.numero}</span>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <span className="text-muted-foreground">État :</span>
                                                            <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                                                                ETATS_TEXTE.find(e => e.value === uploadForm.etat)?.color
                                                            }`}>
                                                                {ETATS_TEXTE.find(e => e.value === uploadForm.etat)?.label}
                                                            </span>
                                                        </div>
                                                        {uploadForm.dateSignature && (
                                                            <div>
                                                                <span className="text-muted-foreground">Signé le :</span>
                                                                <span className="ml-2 font-medium">
                                                                    {new Date(uploadForm.dateSignature).toLocaleDateString("fr-FR")}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Upload zone */}
                                                <div 
                                                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors relative ${
                                                        uploadForm.file 
                                                            ? "border-green-500 bg-green-50 dark:bg-green-950/20" 
                                                            : "border-muted-foreground/25 hover:border-primary/50"
                                                    }`}
                                                >
                                                    {uploadForm.file ? (
                                                        <div className="space-y-2">
                                                            <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
                                                            <p className="font-medium">{uploadForm.file.name}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {(uploadForm.file.size / 1024 / 1024).toFixed(2)} Mo
                                                            </p>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setUploadForm({ ...uploadForm, file: null })}
                                                            >
                                                                Changer de fichier
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            <UploadCloud className="h-12 w-12 mx-auto text-muted-foreground" />
                                                            <div>
                                                                <p className="font-medium">Glissez-déposez votre PDF ici</p>
                                                                <p className="text-sm text-muted-foreground">ou cliquez pour sélectionner</p>
                                                            </div>
                                                            <input
                                                                type="file"
                                                                accept=".pdf"
                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                                onChange={handleFileSelect}
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                <p className="text-xs text-muted-foreground mt-2 flex items-center">
                                                    <Info className="h-3 w-3 mr-1" />
                                                    Formats acceptés : PDF. Taille maximale : 50 Mo. Le texte sera extrait automatiquement par OCR.
                                                </p>
                                            </div>

                                            {uploadMutation.isError && (
                                                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
                                                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                                                    <div>
                                                        <p className="font-medium text-destructive">Erreur lors de l&apos;import</p>
                                                        <p className="text-sm text-muted-foreground">Veuillez vérifier le fichier et réessayer.</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Footer with navigation */}
                                <div className="px-6 py-4 border-t bg-muted/10 flex items-center justify-between">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => {
                                            setIsUploadModalOpen(false);
                                            resetForm();
                                        }}
                                    >
                                        Annuler
                                    </Button>

                                    <div className="flex items-center gap-2">
                                        {currentStep > 1 && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setCurrentStep(prev => prev - 1)}
                                            >
                                                Précédent
                                            </Button>
                                        )}
                                        
                                        {currentStep < 4 ? (
                                            <Button
                                                type="button"
                                                onClick={() => setCurrentStep(prev => prev + 1)}
                                                disabled={!canProceed()}
                                            >
                                                Suivant
                                            </Button>
                                        ) : (
                                            <Button
                                                type="submit"
                                                disabled={!uploadForm.file || uploadMutation.isPending}
                                            >
                                                {uploadMutation.isPending ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Import en cours...
                                                    </>
                                                ) : (
                                                    <>
                                                        <UploadCloud className="mr-2 h-4 w-4" />
                                                        Importer le document
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === "processed") {
        return <span className="flex items-center text-green-600 dark:text-green-400"><CheckCircle className="h-3 w-3 mr-1" /> Traité</span>;
    }
    if (status === "processing") {
        return <span className="flex items-center text-amber-600 dark:text-amber-400"><RefreshCw className="h-3 w-3 mr-1 animate-spin" /> En cours</span>;
    }
    return <span className="flex items-center text-red-600 dark:text-red-400"><AlertCircle className="h-3 w-3 mr-1" /> Erreur</span>;
}
