"use client";

import { RelationsResponse } from "@/lib/api";
import { Link2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const RELATION_TYPES = [
    { key: "abroge", label: "Abroge", color: "text-red-600 dark:text-red-400", dir: "source" },
    { key: "modifie", label: "Modifie", color: "text-amber-600 dark:text-amber-400", dir: "source" },
    { key: "complete", label: "Complète", color: "text-blue-600 dark:text-blue-400", dir: "source" },
    { key: "cite", label: "Cite", color: "text-muted-foreground", dir: "source" },
    { key: "applique", label: "Applique", color: "text-purple-600 dark:text-purple-400", dir: "source" },
    { key: "ratifie", label: "Ratifie", color: "text-teal-600 dark:text-teal-400", dir: "source" },
    { key: "abrogePar", label: "Abrogé par", color: "text-red-600 dark:text-red-400", dir: "cible" },
    { key: "modifiePar", label: "Modifié par", color: "text-amber-600 dark:text-amber-400", dir: "cible" },
    { key: "completePar", label: "Complété par", color: "text-blue-600 dark:text-blue-400", dir: "cible" },
    { key: "citePar", label: "Cité par", color: "text-muted-foreground", dir: "cible" },
    { key: "appliquePar", label: "Appliqué par", color: "text-purple-600 dark:text-purple-400", dir: "cible" },
    { key: "ratifiePar", label: "Ratifié par", color: "text-teal-600 dark:text-teal-400", dir: "cible" },
] as const;

interface RelationsPanelProps {
    relationsData: RelationsResponse;
}

export function RelationsPanel({ relationsData }: RelationsPanelProps) {
    if (relationsData.counts.total === 0) return null;

    const activeRelations = RELATION_TYPES.filter(rt => {
        const rels = relationsData.relations[rt.key as keyof typeof relationsData.relations];
        return rels && rels.length > 0;
    });

    return (
        <div className="border-t pt-8 mt-8">
            <h2 className="text-xl font-bold mb-6 flex items-center">
                <Link2 className="mr-2 h-5 w-5 text-primary" />
                Relations avec d&apos;autres textes
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({relationsData.counts.total})
                </span>
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
                {relationsData.counts.source > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                        <div className="px-4 py-3 bg-muted/30 border-b">
                            <h3 className="font-semibold text-sm">Ce texte agit sur</h3>
                        </div>
                        <ul className="divide-y">
                            {activeRelations
                                .filter(rt => rt.dir === "source")
                                .flatMap(rt => {
                                    const rels = relationsData.relations[rt.key as keyof typeof relationsData.relations];
                                    return rels.filter(rel => rel.texteCible?.id).map(rel => (
                                        <li key={`${rt.key}-${rel.id}`} className="px-4 py-3 flex items-start gap-2 text-sm hover:bg-muted/30 transition-colors">
                                            <span className={cn("font-medium flex-shrink-0 mt-0.5", rt.color)}>
                                                {rt.label}
                                            </span>
                                            <Link href={`/lois/${rel.texteCible!.id}`} className="text-primary hover:underline line-clamp-2">
                                                {rel.texteCible!.titre}
                                            </Link>
                                        </li>
                                    ));
                                })}
                        </ul>
                    </div>
                )}

                {relationsData.counts.cible > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                        <div className="px-4 py-3 bg-muted/30 border-b">
                            <h3 className="font-semibold text-sm">Ce texte est affecté par</h3>
                        </div>
                        <ul className="divide-y">
                            {activeRelations
                                .filter(rt => rt.dir === "cible")
                                .flatMap(rt => {
                                    const rels = relationsData.relations[rt.key as keyof typeof relationsData.relations];
                                    return rels.filter(rel => rel.texteSource?.id).map(rel => (
                                        <li key={`${rt.key}-${rel.id}`} className="px-4 py-3 flex items-start gap-2 text-sm hover:bg-muted/30 transition-colors">
                                            <span className={cn("font-medium flex-shrink-0 mt-0.5", rt.color)}>
                                                {rt.label}
                                            </span>
                                            <Link href={`/lois/${rel.texteSource!.id}`} className="text-primary hover:underline line-clamp-2">
                                                {rel.texteSource!.titre}
                                            </Link>
                                        </li>
                                    ));
                                })}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
