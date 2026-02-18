import { HIERARCHIE_JURIDIQUE, AUTORITES_SIGNATAIRES } from "../constants";
import type { UploadFormState } from "../types";

interface Step3Props {
    form: UploadFormState;
    onChange: (updates: Partial<UploadFormState>) => void;
}

export function Step3DatesMetadata({ form, onChange }: Step3Props) {
    const currentCategory = HIERARCHIE_JURIDIQUE[form.categorie];

    const toggleSignataire = (signataire: string) => {
        const updated = form.signataires.includes(signataire)
            ? form.signataires.filter((s) => s !== signataire)
            : [...form.signataires, signataire];
        onChange({ signataires: updated });
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium mb-4">Dates importantes</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Date de signature</label>
                        <input
                            type="date"
                            className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            value={form.dateSignature}
                            onChange={(e) => onChange({ dateSignature: e.target.value })}
                        />
                    </div>
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
            </div>

            {currentCategory?.fields.showJO && (
                <div>
                    <h3 className="text-lg font-medium mb-4">Journal Officiel</h3>
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
                            <label className="text-sm font-medium mb-1.5 block">URL du JO (optionnel)</label>
                            <input
                                type="url"
                                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background"
                                placeholder="https://..."
                                value={form.urlJO}
                                onChange={(e) => onChange({ urlJO: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            )}

            {currentCategory?.fields.showSignataires && (
                <div>
                    <h3 className="text-lg font-medium mb-4">Signataires</h3>
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-3 border rounded-lg bg-muted/20">
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
                    {form.signataires.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-2">
                            {form.signataires.length} signataire(s) sélectionné(s)
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
                        placeholder={"Vu la Constitution...\nVu la loi n°...\nVu le décret n°..."}
                        value={form.visas}
                        onChange={(e) => onChange({ visas: e.target.value })}
                    />
                </div>
            )}
        </div>
    );
}
