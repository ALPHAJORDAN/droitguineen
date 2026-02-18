"use client";

import { useQueries } from "@tanstack/react-query";
import { fetchLois } from "@/lib/api";
import { queryKeys, useLois } from "@/lib/hooks";
import { HIERARCHIE_JURIDIQUE, ETATS_TEXTE } from "./constants";
import { NATURE_LABELS } from "@/lib/api";
import {
    FileText, TrendingUp, CheckCircle, Loader2, BarChart3,
} from "lucide-react";
import Link from "next/link";

const NATURES = Object.values(HIERARCHIE_JURIDIQUE).map((cat) => cat.nature);
const UNIQUE_NATURES = [...new Set(NATURES)];

export function DashboardTab() {
    // Query total counts per nature
    const natureCounts = useQueries({
        queries: UNIQUE_NATURES.map((nature) => ({
            queryKey: queryKeys.lois.list({ nature, limit: 1 }),
            queryFn: () => fetchLois({ nature, limit: 1 }),
        })),
    });

    // Get recent documents
    const { data: recentData, isLoading: recentLoading } = useLois({ limit: 5 });

    const isLoading = natureCounts.some((q) => q.isLoading);
    const totalDocuments = natureCounts.reduce(
        (sum, q) => sum + (q.data?.pagination.total || 0),
        0
    );

    const countByNature = UNIQUE_NATURES.map((nature, idx) => ({
        nature,
        label: NATURE_LABELS[nature] || nature,
        count: natureCounts[idx]?.data?.pagination.total || 0,
    })).sort((a, b) => b.count - a.count);

    const maxCount = Math.max(...countByNature.map((n) => n.count), 1);

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-card border rounded-lg p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total documents</p>
                            <p className="text-3xl font-bold mt-1">
                                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalDocuments}
                            </p>
                        </div>
                        <FileText className="h-10 w-10 text-primary/20" />
                    </div>
                </div>
                <div className="bg-card border rounded-lg p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Types de documents</p>
                            <p className="text-3xl font-bold mt-1">
                                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : countByNature.filter((n) => n.count > 0).length}
                            </p>
                        </div>
                        <BarChart3 className="h-10 w-10 text-primary/20" />
                    </div>
                </div>
                <div className="bg-card border rounded-lg p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Natures référencées</p>
                            <p className="text-3xl font-bold mt-1">{UNIQUE_NATURES.length}</p>
                        </div>
                        <TrendingUp className="h-10 w-10 text-primary/20" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Distribution by nature */}
                <div className="bg-card border rounded-lg p-5">
                    <h3 className="font-semibold mb-4 flex items-center">
                        <BarChart3 className="h-4 w-4 mr-2 text-primary" />
                        Répartition par nature
                    </h3>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {countByNature.map((item) => (
                                <div key={item.nature} className="flex items-center gap-3">
                                    <span className="text-sm w-32 truncate text-muted-foreground">
                                        {item.label}
                                    </span>
                                    <div className="flex-1 h-6 bg-muted/50 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary/70 rounded-full transition-all duration-500"
                                            style={{ width: `${Math.max((item.count / maxCount) * 100, item.count > 0 ? 4 : 0)}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-medium w-8 text-right">
                                        {item.count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent documents */}
                <div className="bg-card border rounded-lg p-5">
                    <h3 className="font-semibold mb-4 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                        Derniers documents ajoutés
                    </h3>
                    {recentLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : !recentData?.data?.length ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            Aucun document encore
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {recentData.data.map((texte) => (
                                <Link
                                    key={texte.id}
                                    href={`/lois/${texte.id}`}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{texte.titre}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {NATURE_LABELS[texte.nature] || texte.nature}
                                            {texte.createdAt && ` · ${new Date(texte.createdAt).toLocaleDateString("fr-FR")}`}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
