import Link from "next/link";
import Image from "next/image";
import { Scale, BookOpen, FileText, Mail } from "lucide-react";

export function Footer() {
    return (
        <footer className="border-t bg-card">
            <div className="container px-4 md:px-6 py-12">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Brand */}
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center gap-2">
                            <Image src="/logo.png" alt="Logo" width={28} height={28} className="object-contain" />
                            <span className="font-semibold">Droitguinéen</span>
                        </Link>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Plateforme de référence pour l&apos;accès au droit guinéen. Consultation libre des textes législatifs et réglementaires.
                        </p>
                    </div>

                    {/* Textes juridiques */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold">Textes juridiques</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>
                                <Link href="/lois" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
                                    <Scale className="h-3.5 w-3.5" /> Lois & Règlements
                                </Link>
                            </li>
                            <li>
                                <Link href="/recherche?type=Codes" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
                                    <BookOpen className="h-3.5 w-3.5" /> Codes
                                </Link>
                            </li>
                            <li>
                                <Link href="/recherche?type=Jurisprudence" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
                                    <FileText className="h-3.5 w-3.5" /> Jurisprudence
                                </Link>
                            </li>
                            <li>
                                <Link href="/recherche?type=Traites" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
                                    <FileText className="h-3.5 w-3.5" /> Traités
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Ressources */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold">Ressources</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>
                                <Link href="/recherche" className="hover:text-foreground transition-colors">
                                    Recherche avancée
                                </Link>
                            </li>
                            <li>
                                <Link href="/lois" className="hover:text-foreground transition-colors">
                                    Derniers textes publiés
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold">Contact</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="inline-flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5" />
                                support@droitguineen.gn
                            </li>
                        </ul>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Conakry, République de Guinée
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t">
                <div className="container px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 py-4">
                    <p className="text-xs text-muted-foreground">
                        &copy; {new Date().getFullYear()} Droitguinéen. Tous droits réservés.
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Construit pour la transparence juridique en Guinée.
                    </p>
                </div>
            </div>
        </footer>
    );
}
