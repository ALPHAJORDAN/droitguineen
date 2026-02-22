"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { User, loginApi, googleLoginApi, logoutApi, getMeApi, storeTokens, clearTokens, getStoredAccessToken } from "./api";

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    googleLogin: (credential: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Check existing token on mount
    useEffect(() => {
        const token = getStoredAccessToken();
        if (token) {
            getMeApi()
                .then(setUser)
                .catch(() => {
                    clearTokens();
                })
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const response = await loginApi(email, password);
        storeTokens(response.accessToken, response.refreshToken);
        setUser(response.user);
    }, []);

    const googleLogin = useCallback(async (credential: string) => {
        const response = await googleLoginApi(credential);
        storeTokens(response.accessToken, response.refreshToken);
        setUser(response.user);
    }, []);

    const logout = useCallback(async () => {
        try {
            await logoutApi();
        } finally {
            setUser(null);
            router.push("/");
        }
    }, [router]);

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                googleLogin,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
