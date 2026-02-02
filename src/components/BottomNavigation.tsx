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
    { key: "distribution", href: "/distribution", icon: Send, label: "Distro" },
    { key: "analytics", href: "/analytics", icon: BarChart3, label: "Stats" },
    { key: "settings", href: "/settings", icon: Settings, label: "Settings" },
];

export function BottomNavigation() {
    const pathname = usePathname();

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-3 pb-4 md:hidden">
            <nav className="mx-auto flex h-16 max-w-md items-center justify-around rounded-2xl bg-gray-900/95 backdrop-blur-xl border border-gray-800 shadow-2xl shadow-black/50">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            className="relative flex flex-col items-center justify-center p-2 min-w-[56px]"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="nav-active-indicator"
                                    className="absolute inset-0 bg-gradient-to-t from-vibeorange-500/20 to-transparent rounded-xl"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                            <motion.div
                                whileTap={{ scale: 0.9 }}
                                className="relative z-10"
                            >
                                <Icon
                                    className={cn(
                                        "h-6 w-6 transition-all duration-200",
                                        isActive
                                            ? "text-vibeorange-500 drop-shadow-[0_0_8px_rgba(255,107,0,0.5)]"
                                            : "text-gray-500"
                                    )}
                                />
                            </motion.div>
                            <span className={cn(
                                "text-[10px] mt-1 font-medium transition-colors duration-200",
                                isActive ? "text-vibeorange-500" : "text-gray-500"
                            )}>
                                {item.label}
                            </span>
                            {isActive && (
                                <motion.div
                                    layoutId="nav-dot"
                                    className="absolute -bottom-0.5 w-1 h-1 bg-vibeorange-500 rounded-full"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
