import {
    Scale, Building2, Gavel, ScrollText, BookOpen, FileCheck, FileText,
} from "lucide-react";
import { createElement } from "react";

// ============ Interfaces ============

export interface DocumentCategory {
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

// ============ Hiérarchie juridique complète de la Guinée ============

const icon = (Icon: typeof Scale, cls = "h-5 w-5") => createElement(Icon, { className: cls });

export const HIERARCHIE_JURIDIQUE: Record<string, DocumentCategory> = {
    "CONSTITUTION": {
        label: "Constitution",
        nature: "LOI_CONSTITUTIONNELLE",
        icon: icon(Scale),
        description: "Loi fondamentale de la République de Guinée",
        subtypes: [
            { value: "texte_integral", label: "Texte intégral", description: "Constitution complète" },
            { value: "revision", label: "Révision constitutionnelle", description: "Modification de la Constitution" },
            { value: "preambule", label: "Préambule", description: "Préambule de la Constitution" },
        ],
        fields: {
            numero: { prefix: "", format: "Année", placeholder: "Ex: 2010" },
            showVisas: true, showSignataires: true, showJO: true, showDateEntreeVigueur: true,
        }
    },
    "LOI_ORGANIQUE": {
        label: "Loi organique",
        nature: "LOI_ORGANIQUE",
        icon: icon(Building2),
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
            showVisas: true, showSignataires: true, showJO: true, showDateEntreeVigueur: true,
        }
    },
    "LOI": {
        label: "Loi ordinaire",
        nature: "LOI",
        icon: icon(ScrollText),
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
            showVisas: true, showSignataires: true, showJO: true, showDateEntreeVigueur: true,
        }
    },
    "ORDONNANCE": {
        label: "Ordonnance",
        nature: "ORDONNANCE",
        icon: icon(Gavel),
        description: "Acte pris par le Président dans le domaine de la loi",
        subtypes: [
            { value: "habilitation", label: "Sur habilitation", description: "Prise sur habilitation parlementaire" },
            { value: "article_60", label: "Article 60", description: "Ordonnance présidentielle" },
            { value: "transition", label: "Période de transition", description: "Ordonnance de transition" },
            { value: "ratifiee", label: "Ordonnance ratifiée", description: "Ratifiée par le Parlement" },
        ],
        fields: {
            numero: { prefix: "O/", format: "O/AAAA/NNN/PRG", placeholder: "Ex: O/2024/005/PRG" },
            showVisas: true, showSignataires: true, showJO: true, showDateEntreeVigueur: true,
        }
    },
    "DECRET": {
        label: "Décret",
        nature: "DECRET",
        icon: icon(FileCheck),
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
            showVisas: true, showSignataires: true, showJO: true, showDateEntreeVigueur: true,
        }
    },
    "ARRETE": {
        label: "Arrêté",
        nature: "ARRETE",
        icon: icon(FileText),
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
            showVisas: true, showSignataires: true, showJO: false,
        }
    },
    "CIRCULAIRE": {
        label: "Circulaire",
        nature: "CIRCULAIRE",
        icon: icon(FileText),
        description: "Instruction administrative interne",
        subtypes: [
            { value: "interpretative", label: "Circulaire interprétative", description: "Interprétation de textes" },
            { value: "instruction", label: "Instruction", description: "Instructions aux services" },
            { value: "note", label: "Note de service", description: "Note interne" },
        ],
        fields: {
            numero: { prefix: "C/", format: "C/AAAA/NNN", placeholder: "Ex: C/2024/012" },
            showVisas: false, showSignataires: true, showJO: false,
        }
    },
    "CODE": {
        label: "Code",
        nature: "CODE",
        icon: icon(BookOpen),
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
            showVisas: true, showSignataires: true, showJO: true, showDateEntreeVigueur: true,
        }
    },
    "TRAITE": {
        label: "Traité / Convention",
        nature: "TRAITE",
        icon: icon(Scale),
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
            showVisas: true, showSignataires: true, showJO: true, showDateEntreeVigueur: true,
        }
    },
    "DECISION": {
        label: "Décision",
        nature: "DECISION",
        icon: icon(Gavel),
        description: "Décision administrative ou juridictionnelle",
        subtypes: [
            { value: "cour_constitutionnelle", label: "Cour constitutionnelle", description: "Décision CC" },
            { value: "cour_supreme", label: "Cour suprême", description: "Décision CS" },
            { value: "conseil_etat", label: "Conseil d'État", description: "Décision CE" },
            { value: "administrative", label: "Décision administrative", description: "Décision admin" },
        ],
        fields: {
            numero: { prefix: "", format: "N° décision", placeholder: "Ex: DCC-2024-001" },
            showVisas: true, showSignataires: true, showJO: false,
        }
    },
    "JURISPRUDENCE": {
        label: "Jurisprudence",
        nature: "JURISPRUDENCE",
        icon: icon(Gavel),
        description: "Décision de justice faisant autorité",
        subtypes: [
            { value: "cour_constitutionnelle", label: "Cour constitutionnelle", description: "Jurisprudence CC" },
            { value: "cour_supreme", label: "Cour suprême", description: "Jurisprudence CS" },
            { value: "cour_appel", label: "Cour d'appel", description: "Jurisprudence CA" },
            { value: "tribunal", label: "Tribunal", description: "Jurisprudence TPI/TGI" },
        ],
        fields: {
            numero: { prefix: "", format: "Référence", placeholder: "Ex: Arrêt n°..." },
            showVisas: false, showSignataires: true, showJO: false,
        }
    },
};

// ============ Autorités signataires ============

export const AUTORITES_SIGNATAIRES = [
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

// ============ États possibles du texte ============

export const ETATS_TEXTE = [
    { value: "VIGUEUR", label: "En vigueur", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
    { value: "VIGUEUR_DIFF", label: "En vigueur différée", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
    { value: "MODIFIE", label: "Modifié", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
    { value: "ABROGE", label: "Abrogé", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
    { value: "ABROGE_DIFF", label: "Abrogé différé", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
    { value: "PERIME", label: "Périmé", color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400" },
];
