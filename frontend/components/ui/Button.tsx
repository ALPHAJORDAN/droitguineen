import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Note: We haven't installed class-variance-authority or radix-ui/react-slot yet.
// For simplicity in this MVP without full shadcn setup, I'll create a simpler button first.
// If we want full shadcn, we should install those deps.
// Let's stick to a simpler implementation for now to avoid dependency hell without full init.

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive';
    size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', size = 'default', ...props }, ref) => {
        const variants = {
            default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md transition-all active:scale-95",
            outline: "border border-border bg-background hover:bg-accent hover:text-accent-foreground",
            ghost: "hover:bg-accent hover:text-accent-foreground",
            link: "text-primary underline-offset-4 hover:underline",
            destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
        }

        const sizes = {
            default: "h-10 px-6 py-2",
            sm: "h-9 rounded-full px-4 text-xs",
            lg: "h-12 rounded-full px-8 text-base",
            icon: "h-10 w-10 rounded-full",
        }

        return (
            <button
                className={cn(
                    "inline-flex items-center justify-center rounded-full text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                    variants[variant],
                    sizes[size],
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }
