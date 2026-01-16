"use client";

import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface Column {
    key: string;
    label: string;
    format?: (value: any, row?: any) => string | React.ReactNode;
    align?: 'left' | 'center' | 'right';
}

interface DataTableProps {
    columns: Column[];
    data: any[];
    loading?: boolean;
    emptyMessage?: string;
}

export function DataTable({ columns, data, loading = false, emptyMessage = 'No data available' }: DataTableProps) {
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('desc');
        }
    };

    const sortedData = sortKey
        ? [...data].sort((a, b) => {
            const aVal = a[sortKey];
            const bVal = b[sortKey];

            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
            }

            const aStr = String(aVal);
            const bStr = String(bVal);
            return sortDirection === 'asc'
                ? aStr.localeCompare(bStr)
                : bStr.localeCompare(aStr);
        })
        : data;

    if (loading) {
        return (
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-vibeorange-500 border-r-transparent"></div>
                <p className="text-gray-400 mt-4">Loading...</p>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 text-center">
                <p className="text-gray-400">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-800/50">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className={`px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-300 transition-colors ${column.align === 'right' ? 'text-right' :
                                        column.align === 'center' ? 'text-center' :
                                            'text-left'
                                        }`}
                                    onClick={() => handleSort(column.key)}
                                >
                                    <div className="flex items-center gap-2 justify-between">
                                        <span>{column.label}</span>
                                        {sortKey === column.key && (
                                            sortDirection === 'asc'
                                                ? <ChevronUp className="w-4 h-4" />
                                                : <ChevronDown className="w-4 h-4" />
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {sortedData.map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-gray-800/30 transition-colors">
                                {columns.map((column) => {
                                    const value = row[column.key];
                                    const formattedValue = column.format
                                        ? column.format(value, row)
                                        : value;

                                    return (
                                        <td
                                            key={column.key}
                                            className={`px-6 py-4 whitespace-nowrap text-sm text-gray-300 ${column.align === 'right' ? 'text-right' :
                                                column.align === 'center' ? 'text-center' :
                                                    'text-left'
                                                }`}
                                        >
                                            {formattedValue}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
