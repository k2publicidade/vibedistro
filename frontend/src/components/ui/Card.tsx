import { cn } from "@/utils/cn";
import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    variant?: "glass" | "solid" | "outline";
}

export function Card({ children, className, variant = "glass", ...props }: CardProps) {
    return (
        <div
            className={cn(
                "rounded-2xl p-6 transition-all duration-300",
                {
                    "bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl": variant === "glass",
                    "bg-gray-900 border border-gray-800": variant === "solid",
                    "border border-white/10 bg-transparent": variant === "outline",
                },
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
