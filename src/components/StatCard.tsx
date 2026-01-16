import { LucideIcon } from 'lucide-react';
import { formatNumber, formatCurrency, formatPercentage } from '@/lib/formatters';

interface StatCardProps {
    title: string;
    value: number;
    change?: number;
    icon?: LucideIcon;
    format?: 'number' | 'currency' | 'none';
    currency?: string;
    subtitle?: string;
}

export function StatCard({
    title,
    value,
    change,
    icon: Icon,
    format = 'number',
    currency = 'USD',
    subtitle
}: StatCardProps) {
    const formattedValue = format === 'currency'
        ? formatCurrency(value, currency)
        : format === 'number'
            ? formatNumber(value)
            : value.toString();

    return (
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
                {Icon && <Icon className="w-5 h-5 text-gray-600" />}
            </div>
            <p className="text-3xl font-bold mt-2 text-white">{formattedValue}</p>
            <div className="flex items-center justify-between mt-2">
                {change !== undefined && (
                    <span className={`text-sm font-medium ${change >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                        {formatPercentage(change)}
                    </span>
                )}
                {subtitle && (
                    <span className="text-gray-500 text-sm font-medium">{subtitle}</span>
                )}
            </div>
        </div>
    );
}
