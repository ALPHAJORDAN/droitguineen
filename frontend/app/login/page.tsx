"use client";

import { Suspense, useState, useEffect, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { AlertCircle, Loader2, LogIn } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                <LoginPageContent />
            </GoogleOAuthProvider>
        </Suspense>
    );
}

function LoginPageContent() {
    const { login, googleLogin, isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = (() => {
        const param = searchParams.get("redirect");
        // Only allow relative paths starting with / to prevent open redirect
        if (param && param.startsWith("/") && !param.startsWith("//") && !param.startsWith("/\\")) return param;
        return "/admin";
    })();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // If already authenticated, redirect
    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            router.replace(redirect);
        }
    }, [authLoading, isAuthenticated, redirect, router]);

    if (authLoading || isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            await login(email, password);
            router.push(redirect);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Échec de la connexion");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleGoogleLogin(credential: string) {
        setError("");
        setIsSubmitting(true);

        try {
            await googleLogin(credential);
            router.push(redirect);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Échec de la connexion Google");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
            <div className="w-full max-w-md space-y-8">
                {/* Logo & Title */}
                <div className="text-center">
                    <Link href="/" className="inline-flex items-center gap-3 mb-6">
                        <Image
                            src="/logo.png"
                            alt="Droitguinéen"
                            width={48}
                            height={48}
                            className="object-contain"
                        />
                        <span className="text-2xl font-bold">Droitguinéen</span>
                    </Link>
                    <h1 className="text-xl font-semibold">Connexion</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Accédez à l&apos;espace d&apos;administration
                    </p>
                </div>

                <div className="bg-card border rounded-lg p-6 shadow-sm space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Google Sign-In */}
                    {GOOGLE_CLIENT_ID && (
                        <>
                            <div className="flex justify-center">
                                <GoogleLogin
                                    onSuccess={(credentialResponse) => {
                                        if (credentialResponse.credential) {
                                            handleGoogleLogin(credentialResponse.credential);
                                        }
                                    }}
                                    onError={() => setError("Échec de la connexion Google")}
                                    text="signin_with"
                                    width="400"
                                />
                            </div>

                            {/* Separator */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-card px-2 text-muted-foreground">ou</span>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                                Adresse email
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                placeholder="admin@leguinee.gn"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium mb-1.5">
                                Mot de passe
                            </label>
                            <input
                                id="password"
                                type="password"
                                required
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                placeholder="••••••••"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Connexion...
                                </>
                            ) : (
                                <>
                                    <LogIn className="mr-2 h-4 w-4" />
                                    Se connecter
                                </>
                            )}
                        </Button>
                    </form>
                </div>

                <p className="text-center text-xs text-muted-foreground">
                    <Link href="/" className="hover:text-foreground transition-colors">
                        Retour à l&apos;accueil
                    </Link>
                </p>
            </div>
        </div>
    );
}
