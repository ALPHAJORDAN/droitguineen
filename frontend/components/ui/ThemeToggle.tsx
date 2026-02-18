"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/lib/theme-provider";
import { Button } from "./Button";
import { useState, useRef, useEffect } from "react";

export function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="w-9 h-9 p-0"
                aria-label="Changer le thème"
            >
                {resolvedTheme === "dark" ? (
                    <Moon className="h-5 w-5" />
                ) : (
                    <Sun className="h-5 w-5" />
                )}
            </Button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-36 rounded-md border bg-popover shadow-lg z-50">
                    <div className="py-1">
                        <button
                            onClick={() => {
                                setTheme("light");
                                setIsOpen(false);
                            }}
                            className={`flex items-center w-full px-3 py-2 text-sm hover:bg-accent ${
                                theme === "light" ? "text-primary font-medium" : ""
                            }`}
                        >
                            <Sun className="h-4 w-4 mr-2" />
                            Clair
                        </button>
                        <button
                            onClick={() => {
                                setTheme("dark");
                                setIsOpen(false);
                            }}
                            className={`flex items-center w-full px-3 py-2 text-sm hover:bg-accent ${
                                theme === "dark" ? "text-primary font-medium" : ""
                            }`}
                        >
                            <Moon className="h-4 w-4 mr-2" />
                            Sombre
                        </button>
                        <button
                            onClick={() => {
                                setTheme("system");
                                setIsOpen(false);
                            }}
                            className={`flex items-center w-full px-3 py-2 text-sm hover:bg-accent ${
                                theme === "system" ? "text-primary font-medium" : ""
                            }`}
                        >
                            <Monitor className="h-4 w-4 mr-2" />
                            Système
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
