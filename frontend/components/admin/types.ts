import { HIERARCHIE_JURIDIQUE } from "./constants";

export type AdminTab = "dashboard" | "documents" | "users";

export interface UploadFormState {
    // Step 1: Classification
    categorie: keyof typeof HIERARCHIE_JURIDIQUE;
    sousType: string;
    // Step 2: Identification
    titre: string;
    titreComplet: string;
    numero: string;
    nor: string;
    eli: string;
    etat: string;
    // Step 3: Dates & Metadata
    dateSignature: string;
    datePublication: string;
    dateEntreeVigueur: string;
    dateAbrogation: string;
    visas: string;
    signataires: string[];
    sourceJO: string;
    urlJO: string;
    // Step 4: File
    file: File | null;
}

export const INITIAL_UPLOAD_FORM: UploadFormState = {
    categorie: "LOI",
    sousType: "",
    titre: "",
    titreComplet: "",
    numero: "",
    nor: "",
    eli: "",
    etat: "VIGUEUR",
    dateSignature: "",
    datePublication: "",
    dateEntreeVigueur: "",
    dateAbrogation: "",
    visas: "",
    signataires: [],
    sourceJO: "",
    urlJO: "",
    file: null,
};

export interface PreviewData {
    filePath: string;
    extractionMethod: string;
    metadata: {
        titre?: string;
        nature?: string;
        numero?: string;
        dateSignature?: string;
    };
    textPreview: string;
    articles: Array<{ numero: string; contenu: string }>;
    sections: unknown[];
    isCode: boolean;
    articlesCount: number;
    fullTextLength: number;
}
