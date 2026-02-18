"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useUploadPdfPreview, useConfirmUpload } from "@/lib/hooks";
import { HIERARCHIE_JURIDIQUE } from "./constants";
import { INITIAL_UPLOAD_FORM, type UploadFormState, type PreviewData } from "./types";
import { useToast } from "./Toast";
import { Step1FileAndType } from "./steps/Step1FileAndType";
import { Step2ReviewConfirm } from "./steps/Step2ReviewConfirm";
import { UploadCloud, CheckCircle, ArrowLeft } from "lucide-react";

interface UploadModalProps {
    onClose: () => void;
}

const STEPS = [
    { num: 1, label: "Fichier & Type" },
    { num: 2, label: "Vérification" },
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
            setCurrentStep(2);
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

    const handleBack = () => {
        setCurrentStep(1);
        setPreviewData(null);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b bg-muted/30">
                    <h2 className="text-xl font-semibold flex items-center">
                        <UploadCloud className="mr-2 h-5 w-5 text-primary" />
                        Importer un document
                    </h2>

                    {/* Progress Steps */}
                    <div className="flex items-center gap-3 mt-3">
                        {STEPS.map((step, index) => (
                            <div key={step.num} className="flex items-center">
                                <div
                                    className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium transition-colors ${
                                        currentStep === step.num
                                            ? "bg-primary text-primary-foreground"
                                            : currentStep > step.num
                                            ? "bg-green-500 text-white"
                                            : "bg-muted text-muted-foreground"
                                    }`}
                                >
                                    {currentStep > step.num ? (
                                        <CheckCircle className="h-3.5 w-3.5" />
                                    ) : (
                                        step.num
                                    )}
                                </div>
                                <span
                                    className={`ml-2 text-sm ${
                                        currentStep === step.num ? "font-medium" : "text-muted-foreground"
                                    }`}
                                >
                                    {step.label}
                                </span>
                                {index < STEPS.length - 1 && (
                                    <div
                                        className={`w-8 h-0.5 mx-3 ${
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
                        <Step1FileAndType
                            form={form}
                            onChange={updateForm}
                            isUploading={previewMutation.isPending}
                            uploadError={uploadError}
                            onAnalyze={handleAnalyze}
                        />
                    )}
                    {currentStep === 2 && previewData && (
                        <Step2ReviewConfirm
                            form={form}
                            preview={previewData}
                            onChange={updateForm}
                            isConfirming={confirmMutation.isPending}
                            onConfirm={handleConfirm}
                            onBack={handleBack}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-muted/10 flex items-center justify-between">
                    {currentStep === 1 ? (
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Annuler
                        </Button>
                    ) : (
                        <Button type="button" variant="ghost" onClick={handleBack}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour
                        </Button>
                    )}

                    <div>{/* Spacer — confirm button is inside Step2 */}</div>
                </div>
            </div>
        </div>
    );
}
