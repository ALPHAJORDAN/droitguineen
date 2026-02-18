"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { HIERARCHIE_JURIDIQUE, ETATS_TEXTE } from "./constants";
import type { UploadFormState, PreviewData } from "./types";
import {
    FileText, CheckCircle, Loader2, ArrowLeft, FileCheck, Eye,
} from "lucide-react";

interface PreviewModalProps {
    form: UploadFormState;
    preview: PreviewData;
    isConfirming: boolean;
    onConfirm: (editedMetadata: {
        titre: string;
        numero: string;
        dateSignature: string;
    }) => void;
    onBack: () => void;
}

export function PreviewModal({ form, preview, isConfirming, onConfirm, onBack }: PreviewModalProps) {
    const currentCategory = HIERARCHIE_JURIDIQUE[form.categorie];

    // Editable metadata — start from user input, fallback to OCR extraction
    const [titre, setTitre] = useState(form.titre || preview.metadata.titre || "");
    const [numero, setNumero] = useState(form.numero || preview.metadata.numero || "");
    const [dateSignature, setDateSignature] = useState(
        form.dateSignature || (preview.metadata.dateSignature ? preview.metadata.dateSignature.slice(0, 10) : "")
    );

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-6 py-4 border-b bg-muted/30">
                <h2 className="text-xl font-semibold flex items-center">
                    <Eye className="mr-2 h-5 w-5 text-primary" />
                    Aperçu du document extrait
                </h2>
                <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        preview.extractionMethod === "native"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}>
                        {preview.extractionMethod === "native" ? "Extraction native" : "OCR"}
                    </span>
                    <span>{preview.articlesCount} articles extraits</span>
                    <span>{(preview.fullTextLength / 1000).toFixed(1)}k caractères</span>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Editable metadata */}
                <div>
                    <h3 className="text-lg font-medium mb-4 flex items-center">
                        <FileCheck className="h-4 w-4 mr-2 text-primary" />
                        Métadonnées (modifiables)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="text-sm font-medium mb-1.5 block">Titre</label>
                            <input
                                type="text"
                                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                value={titre}
                                onChange={(e) => setTitre(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Nature</label>
                            <div className="px-4 py-2.5 text-sm bg-muted/50 border rounded-lg font-medium">
                                {currentCategory?.label}
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Numéro</label>
                            <input
                                type="text"
                                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                value={numero}
                                onChange={(e) => setNumero(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Date de signature</label>
                            <input
                                type="date"
                                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                value={dateSignature}
                                onChange={(e) => setDateSignature(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">État</label>
                            <div className={`px-4 py-2.5 text-sm border rounded-lg font-medium ${
                                ETATS_TEXTE.find((e) => e.value === form.etat)?.color
                            }`}>
                                {ETATS_TEXTE.find((e) => e.value === form.etat)?.label || form.etat}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Articles preview */}
                {preview.articles.length > 0 && (
                    <div>
                        <h3 className="text-lg font-medium mb-4 flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-primary" />
                            Articles extraits ({preview.articlesCount})
                        </h3>
                        <div className="border rounded-lg divide-y max-h-80 overflow-y-auto">
                            {preview.articles.slice(0, 50).map((article, idx) => (
                                <div key={idx} className="p-3 hover:bg-muted/30 transition-colors">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded flex-shrink-0">
                                            Art. {article.numero}
                                        </span>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {article.contenu.slice(0, 200)}
                                            {article.contenu.length > 200 ? "..." : ""}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {preview.articlesCount > 50 && (
                                <div className="p-3 text-center text-sm text-muted-foreground">
                                    ... et {preview.articlesCount - 50} articles supplémentaires
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Text preview if no articles */}
                {preview.articles.length === 0 && preview.textPreview && (
                    <div>
                        <h3 className="text-lg font-medium mb-4">Aperçu du texte extrait</h3>
                        <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                            <pre className="text-sm whitespace-pre-wrap font-sans text-muted-foreground">
                                {preview.textPreview.slice(0, 3000)}
                                {preview.textPreview.length > 3000 ? "\n..." : ""}
                            </pre>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-muted/10 flex items-center justify-between">
                <Button type="button" variant="ghost" onClick={onBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                </Button>
                <Button
                    type="button"
                    onClick={() => onConfirm({ titre, numero, dateSignature })}
                    disabled={isConfirming || !titre}
                >
                    {isConfirming ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enregistrement...
                        </>
                    ) : (
                        <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Confirmer l&apos;enregistrement
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
