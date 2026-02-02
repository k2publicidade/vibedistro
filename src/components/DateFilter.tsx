"use client";

import { Calendar } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export type DateRange = '7d' | '30d' | '90d' | 'year';

interface DateFilterProps {
    value: DateRange;
    onChange: (range: DateRange) => void;
}

const optionKeys: { value: DateRange; labelKey: string }[] = [
    { value: '7d', labelKey: 'dateFilter.last7days' },
    { value: '30d', labelKey: 'dateFilter.last30days' },
    { value: '90d', labelKey: 'dateFilter.last90days' },
    { value: 'year', labelKey: 'dateFilter.thisYear' },
];

export function DateFilter({ value, onChange }: DateFilterProps) {
    const { t } = useTranslation();

    return (
        <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div className="flex gap-2 bg-gray-900 rounded-lg p-1 border border-gray-800">
                {optionKeys.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${value === option.value
                            ? 'bg-vibeorange-600 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                            }`}
                    >
                        {t(option.labelKey)}
                    </button>
                ))}
            </div>
        </div>
    );
}
