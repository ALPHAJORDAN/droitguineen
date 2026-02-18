import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Administration",
    description: "Espace d'administration pour la gestion des documents juridiques de Droitguinéen. Importez et gérez les textes de loi.",
    robots: {
        index: false,
        follow: false,
    },
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
