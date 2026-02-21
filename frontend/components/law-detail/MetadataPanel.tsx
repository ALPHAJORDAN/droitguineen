"use client";

import { Texte, ETAT_LABELS } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import {
    Calendar, Hash, FileText, ExternalLink, Download,
    User, BookMarked, Shield, Tag,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

function CopyableValue({ label, value }: { label: string; value: string }) {
    const [copied, setCopied] = useState(false);
    const [failed, setFailed] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

    useEffect(() => {
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, []);

    const handleCopy = async () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setFailed(false);
            timerRef.current = setTimeout(() => setCopied(false), 2500);
        } catch {
            setFailed(true);
            setCopied(false);
            timerRef.current = setTimeout(() => setFailed(false), 2500);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className="text-left group"
            aria-label={`Copier ${label}: ${value}`}
        >
            <span className="text-xs text-muted-foreground block">{label}</span>
            <span className="text-sm font-mono group-hover:text-primary transition-colors">
                {copied ? "Copié !" : failed ? "Échec" : value}
            </span>
        </button>
    );
}

interface MetadataPanelProps {
    texte: Texte;
}

export function MetadataPanel({ texte }: MetadataPanelProps) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    const hasIdentifiers = texte.cid || texte.nor || texte.eli;
    const hasDates = texte.dateSignature || texte.datePublication || texte.dateEntreeVigueur;
    const hasJO = texte.sourceJO || texte.urlJO;
    const hasExtra = texte.signataires || texte.sousCategorie || texte.fichierPdf;

    if (!hasIdentifiers && !hasDates && !hasJO && !hasExtra) return null;

    return (
        <div className="border rounded-lg bg-card overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/30">
                <h3 className="font-semibold text-sm flex items-center">
                    <Shield className="mr-2 h-4 w-4 text-primary" />
                    Informations
                </h3>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Identifiers */}
                {texte.cid && <CopyableValue label="CID" value={texte.cid} />}
                {texte.nor && <CopyableValue label="NOR" value={texte.nor} />}
                {texte.eli && <CopyableValue label="ELI" value={texte.eli} />}

                {/* Dates */}
                {texte.dateSignature && (
                    <div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Date de signature
                        </span>
                        <span className="text-sm">{formatDate(texte.dateSignature)}</span>
                    </div>
                )}
                {texte.datePublication && (
                    <div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Date de publication
                        </span>
                        <span className="text-sm">{formatDate(texte.datePublication)}</span>
                    </div>
                )}
                {texte.dateEntreeVigueur && (
                    <div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Entree en vigueur
                        </span>
                        <span className="text-sm">{formatDate(texte.dateEntreeVigueur)}</span>
                    </div>
                )}

                {/* Etat */}
                {texte.etat && (
                    <div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Hash className="h-3 w-3" /> Etat
                        </span>
                        <span className="text-sm">{ETAT_LABELS[texte.etat] || texte.etat}</span>
                    </div>
                )}

                {/* Sous-categorie */}
                {texte.sousCategorie && (
                    <div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Tag className="h-3 w-3" /> Sous-categorie
                        </span>
                        <span className="text-sm">{texte.sousCategorie}</span>
                    </div>
                )}

                {/* Signataires */}
                {texte.signataires && (
                    <div className="sm:col-span-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <User className="h-3 w-3" /> Signataires
                        </span>
                        <span className="text-sm">{texte.signataires}</span>
                    </div>
                )}

                {/* Journal Officiel */}
                {texte.sourceJO && (
                    <div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <BookMarked className="h-3 w-3" /> Source JO
                        </span>
                        <span className="text-sm">{texte.sourceJO}</span>
                    </div>
                )}
                {texte.urlJO && /^https?:\/\//i.test(texte.urlJO) && (
                    <div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" /> Lien JO
                        </span>
                        <a
                            href={texte.urlJO}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                            Voir sur le JO <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>
                )}

                {/* PDF Download */}
                {texte.fichierPdf && (
                    <div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <FileText className="h-3 w-3" /> Fichier PDF
                        </span>
                        <a
                            href={`${API_URL}/${texte.fichierPdf}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                            <Download className="h-3 w-3" /> Telecharger le PDF
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
