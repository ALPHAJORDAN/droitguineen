import { UploadCloud, CheckCircle, FileCheck, Info, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { HIERARCHIE_JURIDIQUE, ETATS_TEXTE } from "../constants";
import type { UploadFormState } from "../types";

interface Step4Props {
    form: UploadFormState;
    onChange: (updates: Partial<UploadFormState>) => void;
    isUploading: boolean;
    uploadError: string | null;
    onAnalyze: () => void;
}

export function Step4FileUpload({ form, onChange, isUploading, uploadError, onAnalyze }: Step4Props) {
    const currentCategory = HIERARCHIE_JURIDIQUE[form.categorie];

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            onChange({ file: e.target.files[0] });
        }
    };

    return (
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
                        {form.sousType && (
                            <div>
                                <span className="text-muted-foreground">Sous-type :</span>
                                <span className="ml-2 font-medium">
                                    {currentCategory?.subtypes.find((s) => s.value === form.sousType)?.label}
                                </span>
                            </div>
                        )}
                        <div className="col-span-2">
                            <span className="text-muted-foreground">Titre :</span>
                            <span className="ml-2 font-medium">{form.titre || "(non renseigné)"}</span>
                        </div>
                        {form.numero && (
                            <div>
                                <span className="text-muted-foreground">Numéro :</span>
                                <span className="ml-2 font-medium">{form.numero}</span>
                            </div>
                        )}
                        <div>
                            <span className="text-muted-foreground">État :</span>
                            <span
                                className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                                    ETATS_TEXTE.find((e) => e.value === form.etat)?.color
                                }`}
                            >
                                {ETATS_TEXTE.find((e) => e.value === form.etat)?.label}
                            </span>
                        </div>
                        {form.dateSignature && (
                            <div>
                                <span className="text-muted-foreground">Signé le :</span>
                                <span className="ml-2 font-medium">
                                    {new Date(form.dateSignature).toLocaleDateString("fr-FR")}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Upload zone */}
                <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors relative ${
                        form.file
                            ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                            : "border-muted-foreground/25 hover:border-primary/50"
                    }`}
                >
                    {form.file ? (
                        <div className="space-y-2">
                            <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
                            <p className="font-medium">{form.file.name}</p>
                            <p className="text-sm text-muted-foreground">
                                {(form.file.size / 1024 / 1024).toFixed(2)} Mo
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => onChange({ file: null })}
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

            {uploadError && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                    <div>
                        <p className="font-medium text-destructive">Erreur lors de l&apos;analyse</p>
                        <p className="text-sm text-muted-foreground">{uploadError}</p>
                    </div>
                </div>
            )}

            {/* Analyze button */}
            {form.file && (
                <div className="flex justify-end">
                    <Button
                        type="button"
                        onClick={onAnalyze}
                        disabled={isUploading}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Analyse en cours...
                            </>
                        ) : (
                            <>
                                <UploadCloud className="mr-2 h-4 w-4" />
                                Analyser le PDF
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
