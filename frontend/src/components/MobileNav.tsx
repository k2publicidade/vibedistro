"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Music, Send, BarChart3, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

const navItems = [
    { key: "dashboard", href: "/dashboard", icon: LayoutDashboard, label: "Home" },
    { key: "catalog", href: "/catalog", icon: Music, label: "Catalog" },
    // { key: "distribution", href: "/distribution", icon: Send, label: "Distro" }, // Commented out to save space on mobile if needed, or keep
    { key: "analytics", href: "/analytics", icon: BarChart3, label: "Stats" },
    { key: "settings", href: "/settings", icon: Settings, label: "Settings" },
];

export function MobileNav({ className }: { className?: string }) {
    const pathname = usePathname();

    return (
        <div className={cn("fixed bottom-0 left-0 right-0 z-50 p-4 pb-6", className)}>
            <div className="glass mx-auto flex h-16 max-w-md items-center justify-around rounded-2xl px-2 shadow-2xl backdrop-blur-xl">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            className="relative flex flex-col items-center justify-center p-2"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="nav-active"
                                    className="absolute inset-0 bg-white/10 rounded-xl"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                            <Icon
                                className={cn(
                                    "h-6 w-6 transition-colors duration-200",
                                    isActive ? "text-vibeorange-500" : "text-gray-400"
                                )}
                            />
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
