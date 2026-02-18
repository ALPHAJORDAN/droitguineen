
"use client";

import { Sidebar } from "@/components/ui/Sidebar";
import { Header } from "@/components/ui/Header";

export default function TextesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <div className="flex flex-1">
                <aside className="hidden w-64 md:block border-r bg-muted/10">
                    <Sidebar />
                </aside>
                <main className="flex-1 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
