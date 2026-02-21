"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth";
import { ToastProvider } from "@/components/admin/Toast";
import { DashboardTab } from "@/components/admin/DashboardTab";
import { DocumentsTab } from "@/components/admin/DocumentsTab";
import { LivresTab } from "@/components/admin/LivresTab";
import { UsersTab } from "@/components/admin/UsersTab";
import type { AdminTab } from "@/components/admin/types";
import {
    Loader2, ShieldAlert, LayoutDashboard, FileText, Users, BookOpen,
} from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function AdminPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            }
        >
            <AdminPageContent />
        </Suspense>
    );
}

const TABS: { id: AdminTab; label: string; icon: typeof LayoutDashboard; adminOnly?: boolean }[] = [
    { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "livres", label: "Bibliotheque", icon: BookOpen },
    { id: "users", label: "Utilisateurs", icon: Users, adminOnly: true },
];

function AdminPageContent() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");

    if (authLoading) {
        return (
            <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </main>
                <Footer />
            </div>
        );
    }

    if (!isAuthenticated || !["ADMIN", "EDITOR"].includes(user?.role || "")) {
        return (
            <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center px-4">
                    <div className="text-center space-y-4 max-w-md">
                        <ShieldAlert className="h-16 w-16 mx-auto text-muted-foreground" />
                        <h1 className="text-2xl font-bold">Accès restreint</h1>
                        <p className="text-muted-foreground">
                            Vous devez être connecté avec un compte administrateur ou éditeur pour accéder à cette page.
                        </p>
                        <Button onClick={() => router.push("/login?redirect=/admin")}>
                            Se connecter
                        </Button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const visibleTabs = TABS.filter((tab) => !tab.adminOnly || user?.role === "ADMIN");

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <ToastProvider>
                <main className="flex-1 container py-8 px-4 md:px-6">
                    {/* Page header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
                        <p className="text-muted-foreground">
                            Gérez les documents et les contenus de la plateforme.
                        </p>
                    </div>

                    {/* Tab navigation */}
                    <div className="flex gap-1 mb-6 border-b">
                        {visibleTabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                                        activeTab === tab.id
                                            ? "border-primary text-primary"
                                            : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                                    }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab content */}
                    <ErrorBoundary>
                        {activeTab === "dashboard" && <DashboardTab />}
                        {activeTab === "documents" && <DocumentsTab />}
                        {activeTab === "livres" && <LivresTab />}
                        {activeTab === "users" && <UsersTab />}
                    </ErrorBoundary>
                </main>
            </ToastProvider>
            <Footer />
        </div>
    );
}
