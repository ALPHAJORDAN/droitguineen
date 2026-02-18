import { UploadCloud, CheckCircle, Info, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { HIERARCHIE_JURIDIQUE } from "../constants";
import type { UploadFormState } from "../types";

interface Step1Props {
    form: UploadFormState;
    onChange: (updates: Partial<UploadFormState>) => void;
    isUploading: boolean;
    uploadError: string | null;
    onAnalyze: () => void;
}

export function Step1FileAndType({ form, onChange, isUploading, uploadError, onAnalyze }: Step1Props) {
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            onChange({ file: e.target.files[0] });
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type === "application/pdf") {
            onChange({ file });
        }
    };

    const canAnalyze = !!form.file && !!form.categorie && !isUploading;

    return (
        <div className="space-y-6">
            {/* Upload zone */}
            <div>
                <h3 className="text-lg font-medium mb-3">Fichier PDF</h3>
                <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors relative ${
                        form.file
                            ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                            : "border-muted-foreground/25 hover:border-primary/50"
                    }`}
                >
                    {form.file ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="h-8 w-8 text-green-500 flex-shrink-0" />
                                <div className="text-left">
                                    <p className="font-medium">{form.file.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {(form.file.size / 1024 / 1024).toFixed(2)} Mo
                                    </p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => onChange({ file: null })}
                            >
                                Changer
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3 py-4">
                            <UploadCloud className="h-10 w-10 mx-auto text-muted-foreground" />
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
                <p className="text-xs text-muted-foreground mt-1.5 flex items-center">
                    <Info className="h-3 w-3 mr-1 flex-shrink-0" />
                    PDF uniquement, 50 Mo max. Le texte sera extrait automatiquement.
                </p>
            </div>

            {/* Category selection */}
            <div>
                <h3 className="text-lg font-medium mb-3">Type de document</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {Object.entries(HIERARCHIE_JURIDIQUE).map(([key, cat]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => onChange({ categorie: key as keyof typeof HIERARCHIE_JURIDIQUE, sousType: "" })}
                            className={`p-3 border rounded-lg text-left transition-all hover:border-primary/50 ${
                                form.categorie === key
                                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                    : "hover:bg-muted/50"
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-md ${
                                    form.categorie === key
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted"
                                }`}>
                                    {cat.icon}
                                </div>
                                <span className="font-medium text-sm">{cat.label}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Error */}
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
            <div className="flex justify-end">
                <Button
                    type="button"
                    onClick={onAnalyze}
                    disabled={!canAnalyze}
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
        </div>
    );
}
