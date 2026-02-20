"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/Button";
import { useLoi, useUpdateLoi } from "@/lib/hooks";
import { NATURE_LABELS, ETAT_LABELS } from "@/lib/api";
import { ETATS_TEXTE, AUTORITES_SIGNATAIRES } from "./constants";
import { useToast } from "./Toast";
import { X, Loader2, Save } from "lucide-react";

interface EditModalProps {
    texteId: string;
    onClose: () => void;
}

export function EditModal({ texteId, onClose }: EditModalProps) {
    const { data: texte, isLoading } = useLoi(texteId);
    const updateMutation = useUpdateLoi();
    const { addToast } = useToast();

    const [formData, setFormData] = useState({
        titre: "",
        titreComplet: "",
        numero: "",
        etat: "VIGUEUR",
        nor: "",
        eli: "",
        dateSignature: "",
        datePublication: "",
        dateEntreeVigueur: "",
        signataires: "",
        visas: "",
        sourceJO: "",
        urlJO: "",
        sousCategorie: "",
    });

    useEffect(() => {
        if (texte) {
            setFormData({
                titre: texte.titre || "",
                titreComplet: texte.titreComplet || "",
                numero: texte.numero || "",
                etat: texte.etat || "VIGUEUR",
                nor: texte.nor || "",
                eli: texte.eli || "",
                dateSignature: texte.dateSignature ? texte.dateSignature.slice(0, 10) : "",
                datePublication: texte.datePublication ? texte.datePublication.slice(0, 10) : "",
                dateEntreeVigueur: texte.dateEntreeVigueur ? texte.dateEntreeVigueur.slice(0, 10) : "",
                signataires: texte.signataires || "",
                visas: texte.visas || "",
                sourceJO: texte.sourceJO || "",
                urlJO: texte.urlJO || "",
                sousCategorie: texte.sousCategorie || "",
            });
        }
    }, [texte]);

    const handleSubmit = async () => {
        // Build payload with only changed fields
        const payload: Record<string, string | undefined> = {};
        if (formData.titre !== (texte?.titre || "")) payload.titre = formData.titre;
        if (formData.titreComplet !== (texte?.titreComplet || "")) payload.titreComplet = formData.titreComplet || undefined;
        if (formData.numero !== (texte?.numero || "")) payload.numero = formData.numero || undefined;
        if (formData.etat !== (texte?.etat || "VIGUEUR")) payload.etat = formData.etat;
        if (formData.nor !== (texte?.nor || "")) payload.nor = formData.nor || undefined;
        if (formData.eli !== (texte?.eli || "")) payload.eli = formData.eli || undefined;
        if (formData.dateSignature !== (texte?.dateSignature ? texte.dateSignature.slice(0, 10) : "")) payload.dateSignature = formData.dateSignature || undefined;
        if (formData.datePublication !== (texte?.datePublication ? texte.datePublication.slice(0, 10) : "")) payload.datePublication = formData.datePublication || undefined;
        if (formData.dateEntreeVigueur !== (texte?.dateEntreeVigueur ? texte.dateEntreeVigueur.slice(0, 10) : "")) payload.dateEntreeVigueur = formData.dateEntreeVigueur || undefined;
        if (formData.signataires !== (texte?.signataires || "")) payload.signataires = formData.signataires || undefined;
        if (formData.visas !== (texte?.visas || "")) payload.visas = formData.visas || undefined;
        if (formData.sourceJO !== (texte?.sourceJO || "")) payload.sourceJO = formData.sourceJO || undefined;
        if (formData.urlJO !== (texte?.urlJO || "")) payload.urlJO = formData.urlJO || undefined;

        if (Object.keys(payload).length === 0) {
            addToast({ type: "info", message: "Aucune modification détectée" });
            return;
        }

        try {
            await updateMutation.mutateAsync({ id: texteId, data: payload });
            addToast({ type: "success", message: "Document mis à jour" });
            onClose();
        } catch (error) {
            addToast({
                type: "error",
                message: error instanceof Error ? error.message : "Erreur lors de la mise à jour",
            });
        }
    };

    return (
        <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 animate-in fade-in duration-200" />
                <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="bg-background rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b bg-muted/30 flex items-center justify-between">
                    <div>
                        <Dialog.Title className="text-lg font-semibold">Modifier le document</Dialog.Title>
                        {texte && (
                            <Dialog.Description className="text-sm text-muted-foreground">
                                {NATURE_LABELS[texte.nature] || texte.nature} · {texte.cid}
                            </Dialog.Description>
                        )}
                    </div>
                    <Dialog.Close asChild>
                        <button className="text-muted-foreground hover:text-foreground" aria-label="Fermer">
                            <X className="h-5 w-5" />
                        </button>
                    </Dialog.Close>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Titre</label>
                                <input
                                    type="text"
                                    className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    value={formData.titre}
                                    onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Titre complet</label>
                                <textarea
                                    rows={2}
                                    className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                                    value={formData.titreComplet}
                                    onChange={(e) => setFormData({ ...formData, titreComplet: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">Numéro</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        value={formData.numero}
                                        onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">État</label>
                                    <select
                                        className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        value={formData.etat}
                                        onChange={(e) => setFormData({ ...formData, etat: e.target.value })}
                                    >
                                        {ETATS_TEXTE.map((etat) => (
                                            <option key={etat.value} value={etat.value}>{etat.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">Date de signature</label>
                                    <input
                                        type="date"
                                        className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        value={formData.dateSignature}
                                        onChange={(e) => setFormData({ ...formData, dateSignature: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">Date de publication</label>
                                    <input
                                        type="date"
                                        className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        value={formData.datePublication}
                                        onChange={(e) => setFormData({ ...formData, datePublication: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">Entrée en vigueur</label>
                                    <input
                                        type="date"
                                        className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        value={formData.dateEntreeVigueur}
                                        onChange={(e) => setFormData({ ...formData, dateEntreeVigueur: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">NOR</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background"
                                        value={formData.nor}
                                        onChange={(e) => setFormData({ ...formData, nor: e.target.value.toUpperCase() })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">ELI</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background"
                                        value={formData.eli}
                                        onChange={(e) => setFormData({ ...formData, eli: e.target.value.toLowerCase() })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Signataires</label>
                                <input
                                    type="text"
                                    className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background"
                                    placeholder="Séparés par des virgules"
                                    value={formData.signataires}
                                    onChange={(e) => setFormData({ ...formData, signataires: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Visas</label>
                                <textarea
                                    rows={3}
                                    className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background resize-none"
                                    value={formData.visas}
                                    onChange={(e) => setFormData({ ...formData, visas: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">Source JO</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background"
                                        value={formData.sourceJO}
                                        onChange={(e) => setFormData({ ...formData, sourceJO: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">URL JO</label>
                                    <input
                                        type="url"
                                        className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background"
                                        value={formData.urlJO}
                                        onChange={(e) => setFormData({ ...formData, urlJO: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-muted/10 flex items-center justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>Annuler</Button>
                    <Button onClick={handleSubmit} disabled={updateMutation.isPending || isLoading}>
                        {updateMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        Enregistrer
                    </Button>
                </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
