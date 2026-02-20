"use client";

import Link from "next/link";
import { getNatureIcon } from "@/lib/constants";
import { NATURE_LABELS, ETAT_LABELS, Texte } from "@/lib/api";
import { formatDate, ETAT_STYLES } from "@/lib/utils";
import { Calendar, ArrowRight } from "lucide-react";

interface TexteCardProps {
    texte: Texte;
    compact?: boolean;
}

export function TexteCard({ texte, compact = false }: TexteCardProps) {
    return (
        <Link
            href={`/lois/${texte.id}`}
            className="group border rounded-lg p-5 hover:border-primary hover:shadow-md transition-all duration-200 bg-card block"
        >
            <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg text-primary flex-shrink-0">
                    {getNatureIcon(texte.nature)}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-medium px-2 py-0.5 bg-muted rounded">
                            {NATURE_LABELS[texte.nature] || texte.nature}
                        </span>
                        {texte.etat && ETAT_LABELS[texte.etat] && (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${ETAT_STYLES[texte.etat] || ETAT_STYLES.VIGUEUR}`}>
                                {ETAT_LABELS[texte.etat]}
                            </span>
                        )}
                        {texte.sousCategorie && (
                            <span className="text-xs font-medium px-2 py-0.5 bg-muted/60 rounded">
                                {texte.sousCategorie}
                            </span>
                        )}
                        {!compact && texte.datePublication && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(texte.datePublication)}
                            </span>
                        )}
                    </div>
                    <h3 className="text-base font-semibold group-hover:text-primary transition-colors line-clamp-2">
                        {texte.titre}
                    </h3>
                    {compact ? (
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            {texte.numero && <span>N&deg; {texte.numero}</span>}
                            {texte.datePublication && (
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(texte.datePublication)}
                                </span>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            {texte.numero && <span>N&deg; {texte.numero}</span>}
                            {texte.signataires && (
                                <span className="truncate max-w-xs">{texte.signataires}</span>
                            )}
                        </div>
                    )}
                </div>
                {!compact && (
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                )}
            </div>
        </Link>
    );
}
