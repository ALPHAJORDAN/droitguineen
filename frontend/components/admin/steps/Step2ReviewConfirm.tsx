"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { HIERARCHIE_JURIDIQUE, ETATS_TEXTE, AUTORITES_SIGNATAIRES } from "../constants";
import type { UploadFormState, PreviewData } from "../types";
import {
    FileText, CheckCircle, Loader2, FileCheck, ChevronDown, Info,
} from "lucide-react";

interface Step2Props {
    form: UploadFormState;
    preview: PreviewData;
    onChange: (updates: Partial<UploadFormState>) => void;
    isConfirming: boolean;
    onConfirm: (editedMetadata: {
        titre: string;
        numero: string;
        dateSignature: string;
    }) => void;
    onBack: () => void;
}

export function Step2ReviewConfirm({ form, preview, onChange, isConfirming, onConfirm, onBack }: Step2Props) {
    const currentCategory = HIERARCHIE_JURIDIQUE[form.categorie];
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Editable metadata — start from user input, fallback to OCR extraction
    const [titre, setTitre] = useState(form.titre || preview.metadata.titre || "");
    const [numero, setNumero] = useState(form.numero || preview.metadata.numero || "");
    const [dateSignature, setDateSignature] = useState(
        form.dateSignature || (preview.metadata.dateSignature ? preview.metadata.dateSignature.slice(0, 10) : "")
    );

    const toggleSignataire = (signataire: string) => {
        const updated = form.signataires.includes(signataire)
            ? form.signataires.filter((s) => s !== signataire)
            : [...form.signataires, signataire];
        onChange({ signataires: updated });
    };

    return (
        <div className="space-y-6">
            {/* Extraction result badges */}
            <div className="flex items-center gap-3 flex-wrap">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    preview.extractionMethod === "native"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                }`}>
                    {preview.extractionMethod === "native" ? "Extraction native" : "OCR"}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted">
                    {preview.articlesCount} articles
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted">
                    {(preview.fullTextLength / 1000).toFixed(1)}k caractères
                </span>
            </div>

            {/* Essential metadata */}
            <div>
                <h3 className="text-base font-medium mb-3 flex items-center">
                    <FileCheck className="h-4 w-4 mr-2 text-primary" />
                    Métadonnées
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="text-sm font-medium mb-1.5 block">
                            Titre <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            placeholder="Titre du document"
                            value={titre}
                            onChange={(e) => setTitre(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Numéro</label>
                        <input
                            type="text"
                            className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            placeholder={currentCategory?.fields.numero?.placeholder || "Ex: 2024/001"}
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
                        <label className="text-sm font-medium mb-1.5 block">Nature</label>
                        <div className="px-4 py-2.5 text-sm bg-muted/50 border rounded-lg font-medium">
                            {currentCategory?.label}
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">État</label>
                        <select
                            className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            value={form.etat}
                            onChange={(e) => onChange({ etat: e.target.value })}
                        >
                            {ETATS_TEXTE.map((etat) => (
                                <option key={etat.value} value={etat.value}>
                                    {etat.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Advanced details — collapsible */}
            <div>
                <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center text-sm text-primary hover:underline"
                >
                    <ChevronDown className={`h-4 w-4 mr-1 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
                    Détails avancés
                </button>

                {showAdvanced && (
                    <div className="mt-3 p-4 bg-muted/20 rounded-lg space-y-4">
                        {/* Sub-category */}
                        {currentCategory?.subtypes.length > 0 && (
                            <div>
                                <label className="text-sm font-medium mb-2 block">Sous-catégorie</label>
                                <div className="flex flex-wrap gap-2">
                                    {currentCategory.subtypes.map((subtype) => (
                                        <button
                                            key={subtype.value}
                                            type="button"
                                            onClick={() => onChange({ sousType: subtype.value })}
                                            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                                                form.sousType === subtype.value
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "bg-background hover:bg-muted"
                                            }`}
                                        >
                                            {subtype.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Full title */}
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Titre complet / Objet</label>
                            <textarea
                                rows={2}
                                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
                                placeholder="Titre complet du document incluant l'objet..."
                                value={form.titreComplet}
                                onChange={(e) => onChange({ titreComplet: e.target.value })}
                            />
                        </div>

                        {/* Secondary dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Date de publication (JO)</label>
                                <input
                                    type="date"
                                    className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                    value={form.datePublication}
                                    onChange={(e) => onChange({ datePublication: e.target.value })}
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
                                        value={form.dateEntreeVigueur}
                                        onChange={(e) => onChange({ dateEntreeVigueur: e.target.value })}
                                    />
                                </div>
                            )}
                            {form.etat === "ABROGE" && (
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">
                                        Date d&apos;abrogation
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                        value={form.dateAbrogation}
                                        onChange={(e) => onChange({ dateAbrogation: e.target.value })}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Journal Officiel */}
                        {currentCategory?.fields.showJO && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">Référence JO</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background"
                                        placeholder="Ex: JO n°2024-15 du 15/03/2024"
                                        value={form.sourceJO}
                                        onChange={(e) => onChange({ sourceJO: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">URL du JO</label>
                                    <input
                                        type="url"
                                        className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background"
                                        placeholder="https://..."
                                        value={form.urlJO}
                                        onChange={(e) => onChange({ urlJO: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Signataires */}
                        {currentCategory?.fields.showSignataires && (
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    Signataires
                                    {form.signataires.length > 0 && (
                                        <span className="text-muted-foreground font-normal ml-2">
                                            ({form.signataires.length} sélectionné{form.signataires.length > 1 ? "s" : ""})
                                        </span>
                                    )}
                                </label>
                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-3 border rounded-lg bg-background">
                                    {AUTORITES_SIGNATAIRES.map((signataire) => (
                                        <button
                                            key={signataire}
                                            type="button"
                                            onClick={() => toggleSignataire(signataire)}
                                            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                                                form.signataires.includes(signataire)
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "bg-background hover:bg-muted"
                                            }`}
                                        >
                                            {signataire}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Visas */}
                        {currentCategory?.fields.showVisas && (
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Visas</label>
                                <textarea
                                    rows={3}
                                    className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
                                    placeholder={"Vu la Constitution...\nVu la loi n°...\nVu le décret n°..."}
                                    value={form.visas}
                                    onChange={(e) => onChange({ visas: e.target.value })}
                                />
                            </div>
                        )}

                        {/* NOR / ELI */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-1.5 flex items-center">
                                    NOR
                                    <span className="ml-1 text-muted-foreground" title="Numéro d'Ordre">
                                        <Info className="h-3 w-3" />
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background"
                                    placeholder="Ex: JUSC2312345A"
                                    value={form.nor}
                                    onChange={(e) => onChange({ nor: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1.5 flex items-center">
                                    ELI
                                    <span className="ml-1 text-muted-foreground" title="European Legislation Identifier">
                                        <Info className="h-3 w-3" />
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background"
                                    placeholder="Ex: eli/loi/2024/123"
                                    value={form.eli}
                                    onChange={(e) => onChange({ eli: e.target.value.toLowerCase() })}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Articles preview */}
            {preview.articles.length > 0 && (
                <div>
                    <h3 className="text-base font-medium mb-3 flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-primary" />
                        Articles extraits ({preview.articlesCount})
                    </h3>
                    <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
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
                    <h3 className="text-base font-medium mb-3">Aperçu du texte extrait</h3>
                    <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                        <pre className="text-sm whitespace-pre-wrap font-sans text-muted-foreground">
                            {preview.textPreview.slice(0, 3000)}
                            {preview.textPreview.length > 3000 ? "\n..." : ""}
                        </pre>
                    </div>
                </div>
            )}

            {/* Confirm button */}
            <div className="flex justify-end pt-2">
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
