"use client";

import { Globe } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Language } from '@/contexts/LanguageContext';
import { useState } from 'react';

const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'pt-BR', name: 'Português', flag: '🇧🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
];

export function LanguageSwitcher() {
    const { language, setLanguage, t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const currentLanguage = languages.find(lang => lang.code === language);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white rounded-md transition-colors"
            >
                <Globe className="w-5 h-5" />
                <span className="flex-1 text-left">{currentLanguage?.name}</span>
                <span className="text-lg">{currentLanguage?.flag}</span>
            </button>

            {isOpen && (
                <div className="absolute left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-md overflow-hidden z-50 shadow-lg">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => {
                                setLanguage(lang.code);
                                setIsOpen(false);
                            }}
                            className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-medium transition-colors ${language === lang.code
                                    ? 'bg-vibeorange-600 text-white'
                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                }`}
                        >
                            <span className="text-lg">{lang.flag}</span>
                            <span className="flex-1 text-left">{lang.name}</span>
                            {language === lang.code && (
                                <span className="text-xs">✓</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
