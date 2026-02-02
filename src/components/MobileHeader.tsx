"use client";

import { LanguageSwitcher } from "./LanguageSwitcher";

export function MobileHeader() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 md:hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-900/95 backdrop-blur-xl border-b border-gray-800">
                <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-vibeorange-400 to-red-500">
                    VibeDistro
                </h1>
                <LanguageSwitcher />
            </div>
        </header>
    );
}
