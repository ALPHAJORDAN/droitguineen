"use client";

import Link from 'next/link';
import Image from 'next/image';
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetTitle,
    SheetDescription,
    SheetClose
} from "@/components/ui/Sheet";
import { Sidebar } from "@/components/ui/Sidebar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Menu, X, Upload, LogIn, LogOut, User } from "lucide-react";
import { useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export function Header() {
    return (
        <Suspense fallback={<HeaderSkeleton />}>
            <HeaderContent />
        </Suspense>
    );
}

function HeaderSkeleton() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
                <div className="mr-2 p-2"><Menu className="h-5 w-5" /></div>
                <div className="flex items-center space-x-2 mr-6">
                    <div className="w-8 h-8 bg-muted rounded" />
                    <span className="font-semibold text-lg hidden sm:inline-block">Droitguinéen</span>
                </div>
                <div className="ml-auto"><ThemeToggle /></div>
            </div>
        </header>
    );
}

function HeaderContent() {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { user, isAuthenticated, logout } = useAuth();
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'EDITOR';

    const isActive = (path: string) => {
        // For /lois route
        if (path === '/lois') {
            return pathname === '/lois' && !searchParams.get('nature');
        }

        // For search routes with query parameters
        if (pathname === '/recherche') {
            const typeParam = searchParams.get('type');
            const url = new URL(path, 'http://localhost');
            const pathType = url.searchParams.get('type');
            if (pathType) return typeParam === pathType;
        }

        return false;
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:text-sm">
                Aller au contenu principal
            </a>
            <div className="container flex h-14 items-center">
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <button className="mr-2 p-2 hover:bg-accent rounded-full transition-colors">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Menu</span>
                        </button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-[300px] flex flex-col" hideDefaultClose>
                        <VisuallyHidden>
                            <SheetTitle>Menu de navigation</SheetTitle>
                            <SheetDescription>Accédez aux textes juridiques</SheetDescription>
                        </VisuallyHidden>
                        <div className="flex items-center justify-between p-4 border-b mt-2">
                            <div className="flex items-center gap-3">
                                <Image
                                    src="/logo.png"
                                    alt="Logo"
                                    width={32}
                                    height={32}
                                    className="object-contain"
                                />
                                <span className="font-semibold text-base">Droitguinéen</span>
                            </div>
                            <SheetClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
                                <X className="h-4 w-4" />
                                <span className="sr-only">Close</span>
                            </SheetClose>
                        </div>
                        <Sidebar className="w-full border-r-0 flex-1 min-h-0" onItemClick={() => setOpen(false)} />
                    </SheetContent>
                </Sheet>

                <Link href="/" className="flex items-center space-x-2 mr-6">
                    <Image
                        src="/logo.png"
                        alt="Droitguinéen Logo"
                        width={32}
                        height={32}
                        className="object-contain"
                        priority
                    />
                    <span className="font-semibold text-lg hidden sm:inline-block">Droitguinéen</span>
                </Link>
                <nav className="hidden md:flex items-center space-x-8 text-sm">
                    <Link
                        href="/lois"
                        aria-current={isActive('/lois') ? "page" : undefined}
                        className={cn(
                            "relative py-1 transition-all hover:text-foreground",
                            isActive('/lois')
                                ? "text-foreground bg-accent/50 px-3 rounded-full after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-primary after:rounded-full"
                                : "text-foreground/70"
                        )}
                    >
                        Lois & Règlements
                    </Link>
                    <Link
                        href="/recherche?type=Codes"
                        aria-current={isActive('/recherche?type=Codes') ? "page" : undefined}
                        className={cn(
                            "relative py-1 transition-all hover:text-foreground",
                            isActive('/recherche?type=Codes')
                                ? "text-foreground bg-accent/50 px-3 rounded-full after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-primary after:rounded-full"
                                : "text-foreground/70"
                        )}
                    >
                        Codes
                    </Link>
                    <Link
                        href="/recherche?type=Jurisprudence"
                        aria-current={isActive('/recherche?type=Jurisprudence') ? "page" : undefined}
                        className={cn(
                            "relative py-1 transition-all hover:text-foreground",
                            isActive('/recherche?type=Jurisprudence')
                                ? "text-foreground bg-accent/50 px-3 rounded-full after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-primary after:rounded-full"
                                : "text-foreground/70"
                        )}
                    >
                        Jurisprudence
                    </Link>
                    <Link
                        href="/recherche"
                        aria-current={pathname === '/recherche' && !searchParams.get('type') ? "page" : undefined}
                        className={cn(
                            "relative py-1 transition-all hover:text-foreground",
                            pathname === '/recherche' && !searchParams.get('type')
                                ? "text-foreground bg-accent/50 px-3 rounded-full after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-primary after:rounded-full"
                                : "text-foreground/70"
                        )}
                    >
                        Recherche
                    </Link>
                </nav>
                <div className="ml-auto flex items-center space-x-2 pr-4">
                    {isAuthenticated ? (
                        <>
                            {isAdmin && (
                                <Link href="/admin">
                                    <Button variant="ghost" size="sm" className="gap-2">
                                        <Upload className="h-4 w-4" />
                                        <span className="hidden lg:inline">Admin</span>
                                    </Button>
                                </Link>
                            )}
                            <span className="hidden md:inline text-sm text-muted-foreground">
                                {user?.prenom} {user?.nom}
                            </span>
                            <Button variant="ghost" size="sm" onClick={() => logout()} className="gap-2">
                                <LogOut className="h-4 w-4" />
                                <span className="hidden lg:inline">Déconnexion</span>
                            </Button>
                        </>
                    ) : (
                        <Link href="/login">
                            <Button variant="ghost" size="sm" className="gap-2">
                                <LogIn className="h-4 w-4" />
                                <span className="hidden lg:inline">Connexion</span>
                            </Button>
                        </Link>
                    )}
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}
