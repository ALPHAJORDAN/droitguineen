import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import { HIERARCHIE_JURIDIQUE, ETATS_TEXTE, type DocumentCategory } from "../constants";
import type { UploadFormState } from "../types";

interface Step2Props {
    form: UploadFormState;
    onChange: (updates: Partial<UploadFormState>) => void;
}

export function Step2Identification({ form, onChange }: Step2Props) {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const currentCategory = HIERARCHIE_JURIDIQUE[form.categorie];

    return (
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
                            value={form.titre}
                            onChange={(e) => onChange({ titre: e.target.value })}
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
                            value={form.titreComplet}
                            onChange={(e) => onChange({ titreComplet: e.target.value })}
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
                                    value={form.numero}
                                    onChange={(e) => onChange({ numero: e.target.value })}
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
                                <label className="text-sm font-medium mb-1.5 flex items-center">
                                    Numéro NOR
                                    <span className="ml-1 text-muted-foreground" title="Numéro d'Ordre - Identifiant unique">
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
                                    Identifiant ELI
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
                    )}
                </div>
            </div>
        </div>
    );
}
