"use client";

import { useState } from "react";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/lib/hooks";
import { AdminUser } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { useToast } from "./Toast";
import {
    Users, UserPlus, Loader2, Trash2, ShieldAlert,
    ChevronLeft, ChevronRight, Eye, EyeOff,
} from "lucide-react";

const ROLE_BADGE: Record<string, string> = {
    ADMIN: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    EDITOR: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    USER: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

export function UsersTab() {
    const { user: currentUser } = useAuth();
    const { addToast } = useToast();

    const [page, setPage] = useState(1);
    const { data: usersData, isLoading } = useUsers(page);
    const createMutation = useCreateUser();
    const updateMutation = useUpdateUser();
    const deleteMutation = useDeleteUser();

    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [newUser, setNewUser] = useState({
        email: "", password: "", nom: "", prenom: "", role: "USER",
    });

    // Non-admin guard
    if (currentUser?.role !== "ADMIN") {
        return (
            <div className="text-center py-12 space-y-4">
                <ShieldAlert className="h-16 w-16 mx-auto text-muted-foreground" />
                <h2 className="text-xl font-bold">Accès réservé aux administrateurs</h2>
                <p className="text-muted-foreground">
                    Seuls les comptes avec le rôle Administrateur peuvent gérer les utilisateurs.
                </p>
            </div>
        );
    }

    const users = usersData?.data || [];
    const totalPages = Math.ceil((usersData?.total || 0) / (usersData?.limit || 20));

    const handleCreate = async () => {
        if (!newUser.email || !newUser.password || !newUser.nom || !newUser.prenom) {
            addToast({ type: "warning", message: "Tous les champs sont requis" });
            return;
        }
        try {
            await createMutation.mutateAsync(newUser);
            addToast({ type: "success", message: "Utilisateur créé" });
            setNewUser({ email: "", password: "", nom: "", prenom: "", role: "USER" });
            setShowCreateForm(false);
        } catch (error) {
            addToast({ type: "error", message: error instanceof Error ? error.message : "Erreur" });
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            await updateMutation.mutateAsync({ id: userId, data: { role: newRole } });
            addToast({ type: "success", message: "Rôle mis à jour" });
        } catch (error) {
            addToast({ type: "error", message: error instanceof Error ? error.message : "Erreur" });
        }
    };

    const handleToggleActive = async (user: AdminUser) => {
        try {
            await updateMutation.mutateAsync({ id: user.id, data: { isActive: !user.isActive } });
            addToast({ type: "success", message: user.isActive ? "Compte désactivé" : "Compte activé" });
        } catch (error) {
            addToast({ type: "error", message: error instanceof Error ? error.message : "Erreur" });
        }
    };

    const handleDelete = (id: string) => {
        if (id === currentUser?.id) return;
        if (pendingDeleteId === id) {
            deleteMutation.mutate(id, {
                onSuccess: () => {
                    addToast({ type: "success", message: "Utilisateur supprimé" });
                    setPendingDeleteId(null);
                    // Reset to page 1 to avoid showing empty page
                    if (users.length <= 1 && page > 1) setPage(1);
                },
                onError: (error) => {
                    addToast({ type: "error", message: error instanceof Error ? error.message : "Erreur" });
                    setPendingDeleteId(null);
                },
            });
        } else {
            setPendingDeleteId(id);
            setTimeout(() => setPendingDeleteId((prev) => (prev === id ? null : prev)), 3000);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg flex items-center">
                    <Users className="mr-2 h-5 w-5 text-primary" />
                    Utilisateurs ({usersData?.total || 0})
                </h2>
                <Button onClick={() => setShowCreateForm(!showCreateForm)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Nouvel utilisateur
                </Button>
            </div>

            {/* Create form */}
            {showCreateForm && (
                <div className="bg-card border rounded-lg p-5 space-y-4">
                    <h3 className="font-medium">Créer un utilisateur</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Prénom *</label>
                            <input
                                type="text"
                                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                value={newUser.prenom}
                                onChange={(e) => setNewUser({ ...newUser, prenom: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Nom *</label>
                            <input
                                type="text"
                                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                value={newUser.nom}
                                onChange={(e) => setNewUser({ ...newUser, nom: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Email *</label>
                            <input
                                type="email"
                                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Mot de passe *</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary pr-10"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    placeholder="Min 8 car., 1 majuscule, 1 chiffre"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Rôle</label>
                            <select
                                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                value={newUser.role}
                                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                            >
                                <option value="USER">Utilisateur</option>
                                <option value="EDITOR">Éditeur</option>
                                <option value="ADMIN">Administrateur</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setShowCreateForm(false)}>Annuler</Button>
                        <Button onClick={handleCreate} disabled={createMutation.isPending}>
                            {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                            Créer
                        </Button>
                    </div>
                </div>
            )}

            {/* Users Table */}
            <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">Aucun utilisateur</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="text-left px-4 py-3 font-medium">Utilisateur</th>
                                    <th className="text-left px-4 py-3 font-medium">Email</th>
                                    <th className="text-left px-4 py-3 font-medium">Rôle</th>
                                    <th className="text-left px-4 py-3 font-medium">Statut</th>
                                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {users.map((u: AdminUser) => {
                                    const isSelf = u.id === currentUser?.id;
                                    return (
                                        <tr key={u.id} className={`hover:bg-muted/30 transition-colors ${!u.isActive ? "opacity-60" : ""}`}>
                                            <td className="px-4 py-3">
                                                <div className="font-medium">{u.prenom} {u.nom}</div>
                                                {isSelf && <span className="text-xs text-primary">(vous)</span>}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={u.role}
                                                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                    disabled={isSelf || updateMutation.isPending}
                                                    className={`px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer ${ROLE_BADGE[u.role] || ROLE_BADGE.USER}`}
                                                >
                                                    <option value="USER">Utilisateur</option>
                                                    <option value="EDITOR">Éditeur</option>
                                                    <option value="ADMIN">Administrateur</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => !isSelf && handleToggleActive(u)}
                                                    disabled={isSelf}
                                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                                        u.isActive
                                                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                                    } ${isSelf ? "cursor-default" : "cursor-pointer hover:opacity-80"}`}
                                                >
                                                    {u.isActive ? "Actif" : "Inactif"}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button
                                                    variant={pendingDeleteId === u.id ? "destructive" : "ghost"}
                                                    size="sm"
                                                    onClick={() => handleDelete(u.id)}
                                                    disabled={isSelf || deleteMutation.isPending}
                                                >
                                                    {deleteMutation.isPending && pendingDeleteId === u.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : pendingDeleteId === u.id ? (
                                                        <span className="text-xs">Confirmer ?</span>
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Page {page} sur {totalPages}</p>
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
        </div>
    );
}
