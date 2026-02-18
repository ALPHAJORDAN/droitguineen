import { HIERARCHIE_JURIDIQUE, type DocumentCategory } from "../constants";
import type { UploadFormState } from "../types";

interface Step1Props {
    form: UploadFormState;
    onChange: (updates: Partial<UploadFormState>) => void;
}

export function Step1Classification({ form, onChange }: Step1Props) {
    const currentCategory = HIERARCHIE_JURIDIQUE[form.categorie];

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium mb-4">Type de document juridique</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Sélectionnez la catégorie du document selon la hiérarchie des normes guinéennes
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(HIERARCHIE_JURIDIQUE).map(([key, cat]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => onChange({ categorie: key as keyof typeof HIERARCHIE_JURIDIQUE, sousType: "" })}
                            className={`p-4 border rounded-lg text-left transition-all hover:border-primary/50 ${
                                form.categorie === key
                                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                    : "hover:bg-muted/50"
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${
                                    form.categorie === key
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted"
                                }`}>
                                    {cat.icon}
                                </div>
                                <div>
                                    <div className="font-medium">{cat.label}</div>
                                    <div className="text-xs text-muted-foreground line-clamp-1">
                                        {cat.description}
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {currentCategory?.subtypes.length > 0 && (
                <div>
                    <h3 className="text-lg font-medium mb-4">Sous-catégorie</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {currentCategory.subtypes.map((subtype) => (
                            <button
                                key={subtype.value}
                                type="button"
                                onClick={() => onChange({ sousType: subtype.value })}
                                className={`p-3 border rounded-lg text-left transition-all ${
                                    form.sousType === subtype.value
                                        ? "border-primary bg-primary/5"
                                        : "hover:bg-muted/50"
                                }`}
                            >
                                <div className="font-medium text-sm">{subtype.label}</div>
                                {subtype.description && (
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                        {subtype.description}
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
