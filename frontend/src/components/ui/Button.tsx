"use client";

import { cn } from "@/utils/cn";
import { Loader2 } from "lucide-react";
import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "glass";
    size?: "sm" | "md" | "lg";
    isLoading?: boolean;
    leftIcon?: React.ElementType;
    rightIcon?: React.ElementType;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", isLoading, leftIcon: LeftIcon, rightIcon: RightIcon, children, ...props }, ref) => {
        const variants = {
            primary: "bg-gradient-to-r from-vibeorange-500 to-red-600 text-white shadow-lg hover:shadow-orange-500/20 border border-transparent",
            secondary: "bg-white text-black hover:bg-gray-100 border border-transparent",
            ghost: "bg-transparent text-gray-300 hover:text-white hover:bg-white/5",
            glass: "bg-white/10 backdrop-blur-md border border-white/10 text-white hover:bg-white/20",
        };

        const sizes = {
            sm: "h-8 px-4 text-xs",
            md: "h-10 px-6 text-sm",
            lg: "h-12 px-8 text-base",
        };

        return (
            <motion.button
                ref={ref}
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.02 }}
                className={cn(
                    "relative inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none",
                    variants[variant],
                    sizes[size],
                    className
                )}
                disabled={isLoading || props.disabled}
                {...(props as any)}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!isLoading && LeftIcon && <LeftIcon className="mr-2 h-4 w-4" />}
                {children}
                {!isLoading && RightIcon && <RightIcon className="ml-2 h-4 w-4" />}
            </motion.button>
        );
    }
);

Button.displayName = "Button";
