"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

interface Toast {
    id: string;
    type: "success" | "error" | "info" | "warning";
    message: string;
}

interface ToastContextValue {
    addToast: (toast: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContextValue>({ addToast: () => {} });

export function useToast() {
    return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback(
        (toast: Omit<Toast, "id">) => {
            const id = Math.random().toString(36).slice(2);
            setToasts((prev) => [...prev, { ...toast, id }]);
            const duration = toast.type === "error" ? 6000 : 4000;
            setTimeout(() => removeToast(id), duration);
        },
        [removeToast]
    );

    const icons = {
        success: <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />,
        error: <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />,
        info: <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />,
        warning: <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />,
    };

    const colors = {
        success: "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800",
        error: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800",
        info: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",
        warning: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg animate-in slide-in-from-right fade-in duration-200 ${colors[toast.type]}`}
                    >
                        {icons[toast.type]}
                        <p className="text-sm font-medium flex-1">{toast.message}</p>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="text-muted-foreground hover:text-foreground flex-shrink-0"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
