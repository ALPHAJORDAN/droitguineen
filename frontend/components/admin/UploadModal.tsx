"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useUploadPdfPreview, useConfirmUpload } from "@/lib/hooks";
import { HIERARCHIE_JURIDIQUE } from "./constants";
import { INITIAL_UPLOAD_FORM, type UploadFormState, type PreviewData } from "./types";
import { useToast } from "./Toast";
import { Step1Classification } from "./steps/Step1Classification";
import { Step2Identification } from "./steps/Step2Identification";
import { Step3DatesMetadata } from "./steps/Step3DatesMetadata";
import { Step4FileUpload } from "./steps/Step4FileUpload";
import { PreviewModal } from "./PreviewModal";
import { UploadCloud, CheckCircle } from "lucide-react";

interface UploadModalProps {
    onClose: () => void;
}

const STEPS = [
    { num: 1, label: "Classification" },
    { num: 2, label: "Identification" },
    { num: 3, label: "Dates & État" },
    { num: 4, label: "Fichier" },
];

export function UploadModal({ onClose }: UploadModalProps) {
    const [form, setForm] = useState<UploadFormState>(INITIAL_UPLOAD_FORM);
    const [currentStep, setCurrentStep] = useState(1);
    const [previewData, setPreviewData] = useState<PreviewData | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const { addToast } = useToast();
    const previewMutation = useUploadPdfPreview();
    const confirmMutation = useConfirmUpload();

    const currentCategory = HIERARCHIE_JURIDIQUE[form.categorie];

    const updateForm = (updates: Partial<UploadFormState>) => {
        setForm((prev) => ({ ...prev, ...updates }));
    };

    const canProceed = () => {
        switch (currentStep) {
            case 1: return !!form.categorie;
            case 2: return !!form.titre || !!form.file;
            case 3: return true;
            default: return true;
        }
    };

    const handleAnalyze = async () => {
        if (!form.file) return;
        setUploadError(null);

        try {
            const result = await previewMutation.mutateAsync({
                file: form.file,
                metadata: {
                    titre: form.titre || undefined,
                    nature: currentCategory.nature,
                    sousCategorie: form.sousType || undefined,
                    numero: form.numero || undefined,
                    dateSignature: form.dateSignature || undefined,
                    datePublication: form.datePublication || undefined,
                    sourceJO: form.sourceJO || undefined,
                },
            });
            setPreviewData(result);
        } catch (error) {
            setUploadError(error instanceof Error ? error.message : "Erreur lors de l'analyse du PDF");
        }
    };

    const handleConfirm = async (editedMetadata: {
        titre: string;
        numero: string;
        dateSignature: string;
    }) => {
        if (!previewData) return;

        try {
            await confirmMutation.mutateAsync({
                filePath: previewData.filePath,
                cid: `LEGITEXT${Date.now()}`,
                titre: editedMetadata.titre,
                nature: currentCategory.nature,
                sousCategorie: form.sousType || undefined,
                numero: editedMetadata.numero || undefined,
                dateSignature: editedMetadata.dateSignature || undefined,
                datePublication: form.datePublication || undefined,
                sourceJO: form.sourceJO || undefined,
                articles: previewData.articles,
                sections: previewData.sections,
            });
            addToast({ type: "success", message: "Document enregistré avec succès" });
            onClose();
        } catch (error) {
            addToast({
                type: "error",
                message: error instanceof Error ? error.message : "Erreur lors de l'enregistrement",
            });
        }
    };

    const handleClose = () => {
        onClose();
    };

    // If preview data is set, show the preview modal
    if (previewData) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                    <PreviewModal
                        form={form}
                        preview={previewData}
                        isConfirming={confirmMutation.isPending}
                        onConfirm={handleConfirm}
                        onBack={() => setPreviewData(null)}
                    />
                </div>
            </div>
        );
    }

    return (
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
                        {STEPS.map((step, index) => (
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
                                    {currentStep > step.num ? (
                                        <CheckCircle className="h-4 w-4" />
                                    ) : (
                                        step.num
                                    )}
                                </button>
                                <span
                                    className={`ml-2 text-sm hidden sm:block ${
                                        currentStep === step.num ? "font-medium" : "text-muted-foreground"
                                    }`}
                                >
                                    {step.label}
                                </span>
                                {index < STEPS.length - 1 && (
                                    <div
                                        className={`w-12 h-0.5 mx-2 ${
                                            currentStep > step.num ? "bg-green-500" : "bg-muted"
                                        }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {currentStep === 1 && (
                        <Step1Classification form={form} onChange={updateForm} />
                    )}
                    {currentStep === 2 && (
                        <Step2Identification form={form} onChange={updateForm} />
                    )}
                    {currentStep === 3 && (
                        <Step3DatesMetadata form={form} onChange={updateForm} />
                    )}
                    {currentStep === 4 && (
                        <Step4FileUpload
                            form={form}
                            onChange={updateForm}
                            isUploading={previewMutation.isPending}
                            uploadError={uploadError}
                            onAnalyze={handleAnalyze}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-muted/10 flex items-center justify-between">
                    <Button type="button" variant="ghost" onClick={handleClose}>
                        Annuler
                    </Button>

                    <div className="flex items-center gap-2">
                        {currentStep > 1 && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCurrentStep((prev) => prev - 1)}
                            >
                                Précédent
                            </Button>
                        )}
                        {currentStep < 4 && (
                            <Button
                                type="button"
                                onClick={() => setCurrentStep((prev) => prev + 1)}
                                disabled={!canProceed()}
                            >
                                Suivant
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
