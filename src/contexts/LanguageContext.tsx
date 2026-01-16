"use client";

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { translations as ptBR } from '@/locales/pt-BR';
import { translations as en } from '@/locales/en';
import { translations as es } from '@/locales/es';

export type Language = 'pt-BR' | 'en' | 'es';

type Translations = typeof ptBR;

const translations: Record<Language, Translations> = {
    'pt-BR': ptBR,
    'en': en,
    'es': es,
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
    children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
    const [language, setLanguageState] = useState<Language>('pt-BR');

    // Load language from localStorage on mount
    useEffect(() => {
        const savedLanguage = localStorage.getItem('language') as Language;
        if (savedLanguage && (savedLanguage === 'pt-BR' || savedLanguage === 'en' || savedLanguage === 'es')) {
            setLanguageState(savedLanguage);
        }
    }, []);

    // Save language to localStorage when it changes
    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);
    };

    // Translation function with dot notation support
    const t = (key: string): string => {
        const keys = key.split('.');
        let value: any = translations[language];

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                console.warn(`Translation key not found: ${key}`);
                return key;
            }
        }

        return typeof value === 'string' ? value : key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}
