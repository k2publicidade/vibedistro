"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Music, Send, BarChart3, Settings } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useTranslation } from "@/hooks/useTranslation";

const navigationIcons = [
    { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
    { key: "catalog", href: "/catalog", icon: Music },
    { key: "distribution", href: "/distribution", icon: Send },
    { key: "analytics", href: "/analytics", icon: BarChart3 },
];

export function Sidebar() {
    const pathname = usePathname();
    const { t } = useTranslation();

    return (
        <div className="hidden md:flex flex-col w-64 bg-gray-900 border-r border-gray-800 text-white min-h-screen">
            <div className="flex items-center justify-center h-16 border-b border-gray-800">
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-vibeorange-400 to-red-600">
                    VibeDistro
                </h1>
            </div>

            {/* Language Switcher */}
            <div className="px-4 py-4 border-b border-gray-800">
                <LanguageSwitcher />
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2">
                {navigationIcons.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                                ? "bg-gray-800 text-white"
                                : "text-gray-400 hover:bg-gray-800 hover:text-white"
                                }`}
                        >
                            <item.icon className="mr-3 h-5 w-5" />
                            {t(`nav.${item.key}`)}
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4 border-t border-gray-800">
                <button className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white rounded-md">
                    <Settings className="mr-3 h-5 w-5" />
                    {t('nav.settings')}
                </button>
            </div>
        </div>
    );
}
