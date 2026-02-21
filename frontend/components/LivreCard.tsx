"use client";

import Link from "next/link";
import { Livre, CATEGORIE_LIVRE_LABELS } from "@/lib/api";
import { BookOpen, User, Calendar, ArrowRight } from "lucide-react";

interface LivreCardProps {
    livre: Livre;
    compact?: boolean;
}

export function LivreCard({ livre, compact = false }: LivreCardProps) {
    return (
        <Link
            href={`/bibliotheque/${livre.id}`}
            className="group border rounded-lg p-5 hover:border-primary hover:shadow-md transition-all duration-200 bg-card block"
        >
            <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg text-primary flex-shrink-0">
                    <BookOpen className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-medium px-2 py-0.5 bg-muted rounded">
                            {CATEGORIE_LIVRE_LABELS[livre.categorie] || livre.categorie}
                        </span>
                        {!compact && livre.anneePublication && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {livre.anneePublication}
                            </span>
                        )}
                    </div>
                    <h3 className="text-base font-semibold group-hover:text-primary transition-colors line-clamp-2">
                        {livre.titre}
                    </h3>
                    {compact ? (
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {livre.auteur}
                            </span>
                            {livre.anneePublication && (
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {livre.anneePublication}
                                </span>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {livre.auteur}
                                </span>
                                {livre.editeur && (
                                    <span className="truncate max-w-xs">{livre.editeur}</span>
                                )}
                            </div>
                            {livre.resume && (
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{livre.resume}</p>
                            )}
                        </>
                    )}
                </div>
                {!compact && (
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                )}
            </div>
        </Link>
    );
}
