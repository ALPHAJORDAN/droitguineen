"use client";

import { useState } from "react";
import { useInvitations, useCreateInvitation, useRevokeInvitation } from "@/lib/hooks";
import { Invitation, PROFESSION_LABELS } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { useToast } from "./Toast";
import {
    Mail, Trash2, RefreshCw, Loader2, Plus,
    ChevronLeft, ChevronRight, X, UserPlus, Check, Clock, XCircle,
} from "lucide-react";

const ITEMS_PER_PAGE = 20;
const ROLES = [
    { value: "USER", label: "Utilisateur" },
    { value: "EDITOR", label: "Éditeur" },
    { value: "ADMIN", label: "Administrateur" },
];
const PROFESSIONS = Object.entries(PROFESSION_LABELS).map(([value, label]) => ({ value, label }));

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: typeof Clock }> = {
    PENDING: { label: "En attente", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
    ACCEPTED: { label: "Acceptée", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: Check },
    REVOKED: { label: "Révoquée", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
};

export function InvitationsTab() {
    const [page, setPage] = useState(1);
    const { data, isLoading, refetch } = useInvitations(page);
    const createMutation = useCreateInvitation();
    const revokeMutation = useRevokeInvitation();
    const { addToast } = useToast();

    const invitations = data?.data || [];
    const pagination = data?.pagination;
    const totalPages = pagination?.totalPages || 1;

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [pendingRevokeId, setPendingRevokeId] = useState<string | null>(null);

    const handleRevoke = (id: string) => {
        if (pendingRevokeId === id) {
            revokeMutation.mutate(id, {
                onSuccess: () => {
                    addToast({ type: "success", message: "Invitation révoquée" });
                    setPendingRevokeId(null);
                },
                onError: (error) => {
                    addToast({ type: "error", message: error instanceof Error ? error.message : "Erreur" });
                    setPendingRevokeId(null);
                },
            });
        } else {
            setPendingRevokeId(id);
            setTimeout(() => setPendingRevokeId((prev) => (prev === id ? null : prev)), 3000);
        }
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
                <Button onClick={() => setShowCreateForm(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Inviter un utilisateur
                </Button>
            </div>

            {/* Invitations List */}
            <div className="bg-card border rounded-lg shadow-sm">
                <div className="p-4 border-b flex items-center justify-between">
                    <h2 className="font-semibold flex items-center">
                        <Mail className="mr-2 h-5 w-5 text-primary" />
                        Invitations {pagination ? `(${pagination.total})` : ""}
                    </h2>
                </div>

                <div className="divide-y">
                    {isLoading ? (
                        <div className="p-8 text-center text-muted-foreground flex items-center justify-center">
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            Chargement...
                        </div>
                    ) : invitations.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Aucune invitation</p>
                            <p className="text-sm mt-1">Invitez des magistrats, avocats et juristes à rejoindre la plateforme.</p>
                        </div>
                    ) : (
                        invitations.map((inv: Invitation) => {
                            const status = STATUS_CONFIG[inv.status] || STATUS_CONFIG.PENDING;
                            const StatusIcon = status.icon;
                            return (
                                <div key={inv.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-start space-x-4 flex-1 min-w-0">
                                        <div className="p-2 bg-primary/10 rounded flex-shrink-0">
                                            <Mail className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-medium text-sm truncate">{inv.email}</h3>
                                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                                                    <StatusIcon className="h-3 w-3" />
                                                    {status.label}
                                                </span>
                                                <span className="px-1.5 py-0.5 bg-muted rounded">
                                                    {ROLES.find(r => r.value === inv.role)?.label || inv.role}
                                                </span>
                                                <span className="px-1.5 py-0.5 bg-muted rounded">
                                                    {PROFESSION_LABELS[inv.profession] || inv.profession}
                                                </span>
                                                <span>
                                                    par {inv.invitedBy.prenom} {inv.invitedBy.nom}
                                                </span>
                                                <span>
                                                    {new Date(inv.createdAt).toLocaleDateString('fr-FR')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {inv.status === "PENDING" && (
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <Button
                                                variant={pendingRevokeId === inv.id ? "destructive" : "ghost"}
                                                size="sm"
                                                onClick={() => handleRevoke(inv.id)}
                                                disabled={revokeMutation.isPending}
                                            >
                                                {revokeMutation.isPending && pendingRevokeId === inv.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : pendingRevokeId === inv.id ? (
                                                    <span className="text-xs">Confirmer ?</span>
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Page {page} sur {totalPages}
                        </p>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Invitation Modal */}
            {showCreateForm && (
                <CreateInvitationModal
                    onClose={() => setShowCreateForm(false)}
                    onCreate={(data) => {
                        createMutation.mutate(data, {
                            onSuccess: () => {
                                addToast({ type: "success", message: "Invitation envoyée" });
                                setShowCreateForm(false);
                            },
                            onError: (error) => {
                                addToast({ type: "error", message: error instanceof Error ? error.message : "Erreur" });
                            },
                        });
                    }}
                    isPending={createMutation.isPending}
                />
            )}
        </div>
    );
}

function CreateInvitationModal({
    onClose,
    onCreate,
    isPending,
}: {
    onClose: () => void;
    onCreate: (data: { email: string; role: string; profession: string }) => void;
    isPending: boolean;
}) {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("USER");
    const [profession, setProfession] = useState("JURISTE");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;
        onCreate({ email: email.trim(), role, profession });
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-background border rounded-xl shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">Inviter un utilisateur</h2>
                    <button onClick={onClose} className="p-1 hover:bg-muted rounded">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Email *</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="magistrat@exemple.com"
                            className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Profession *</label>
                        <select
                            value={profession}
                            onChange={(e) => setProfession(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                            {PROFESSIONS.map((p) => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Role *</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                            {ROLES.map((r) => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        L&apos;utilisateur pourra se connecter avec son compte Google correspondant à cet email.
                    </p>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
                        <Button type="submit" disabled={isPending || !email.trim()}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Inviter
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
