"use client";

import { useState } from 'react';
import { StatCard } from '@/components/StatCard';
import { LineChart, BarChart } from '@/components/Chart';
import { DataTable } from '@/components/DataTable';
import { DateFilter, DateRange } from '@/components/DateFilter';
import { TrendingUp, Users, Clock, SkipForward, Music, DollarSign } from 'lucide-react';
import {
    analyticsMetrics,
    platformBreakdown,
    topTracks,
    streamingData,
    topCountries
} from '@/lib/mockData';
import { formatNumber, formatCurrency, formatDuration } from '@/lib/formatters';
import { useTranslation } from '@/hooks/useTranslation';

export default function Analytics() {
    const [dateRange, setDateRange] = useState<DateRange>('30d');
    const { t } = useTranslation();

    const chartData = streamingData.map(d => ({
        date: d.date,
        value: d.streams,
    }));

    const platformChartData = platformBreakdown.map(p => ({
        label: p.platform,
        value: p.streams,
        color: p.platform === 'Spotify' ? '#1DB954' :
            p.platform === 'Apple Music' ? '#FA243C' :
                p.platform === 'YouTube Music' ? '#FF0000' :
                    p.platform === 'Deezer' ? '#FF6600' :
                        p.platform === 'Amazon Music' ? '#FF9900' : '#a855f7',
    }));

    const trackColumns = [
        {
            key: 'title',
            label: t('analytics.track'),
            format: (value: string, row: any) => (
                <div>
                    <div className="font-medium text-white">{value}</div>
                    <div className="text-xs text-gray-400">{row.artist}</div>
                </div>
            )
        },
        { key: 'album', label: t('analytics.album'), align: 'left' as const },
        {
            key: 'streams',
            label: t('analytics.streams'),
            format: formatNumber,
            align: 'right' as const
        },
        {
            key: 'saves',
            label: t('analytics.saves'),
            format: formatNumber,
            align: 'right' as const
        },
        {
            key: 'playlists',
            label: t('analytics.playlists'),
            format: (value: number) => value.toString(),
            align: 'right' as const
        },
        {
            key: 'duration',
            label: t('analytics.duration'),
            format: formatDuration,
            align: 'right' as const
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-vibeorange-400 to-red-600">
                    {t('analytics.title')}
                </h1>
                <DateFilter value={dateRange} onChange={setDateRange} />
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title={t('analytics.totalStreams')}
                    value={analyticsMetrics.totalStreams}
                    icon={TrendingUp}
                    format="number"
                    change={12.5}
                />
                <StatCard
                    title={t('analytics.uniqueListeners')}
                    value={analyticsMetrics.uniqueListeners}
                    icon={Users}
                    format="number"
                    change={8.3}
                />
                <StatCard
                    title={t('analytics.avgPlayDuration')}
                    value={analyticsMetrics.avgPlayDuration}
                    icon={Clock}
                    format="none"
                    subtitle={formatDuration(analyticsMetrics.avgPlayDuration)}
                />
                <StatCard
                    title={t('analytics.skipRate')}
                    value={analyticsMetrics.skipRate}
                    icon={SkipForward}
                    format="none"
                    subtitle={`${analyticsMetrics.skipRate.toFixed(1)}%`}
                    change={-2.1}
                />
            </div>

            {/* Streams Over Time */}
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-vibeorange-500" />
                        <h3 className="text-lg font-bold">{t('analytics.streamsOverTime')}</h3>
                    </div>
                    <span className="text-sm text-gray-400">
                        {dateRange === '7d' ? t('dateFilter.last7days') :
                            dateRange === '30d' ? t('dateFilter.last30days') :
                                dateRange === '90d' ? t('dateFilter.last90days') : t('dateFilter.thisYear')}
                    </span>
                </div>
                <LineChart data={chartData} height={300} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Platform Breakdown */}
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                    <div className="flex items-center gap-2 mb-6">
                        <Music className="w-5 h-5 text-blue-500" />
                        <h3 className="text-lg font-bold">{t('analytics.platformBreakdown')}</h3>
                    </div>
                    <BarChart data={platformChartData} height={300} />
                </div>

                {/* Revenue by Platform */}
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                    <div className="flex items-center gap-2 mb-6">
                        <DollarSign className="w-5 h-5 text-green-500" />
                        <h3 className="text-lg font-bold">{t('analytics.revenueByPlatform')}</h3>
                    </div>
                    <div className="space-y-4">
                        {platformBreakdown.map((platform) => (
                            <div key={platform.platform} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-white">{platform.platform}</p>
                                        <p className="text-xs text-gray-400">
                                            {formatNumber(platform.streams)} {t('analytics.streams')} ({platform.percentage}%)
                                        </p>
                                    </div>
                                    <span className="text-sm font-bold text-green-500">
                                        {formatCurrency(platform.revenue)}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-800 rounded-full h-2">
                                    <div
                                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all"
                                        style={{ width: `${platform.percentage}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                        <div className="pt-4 border-t border-gray-800">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-white">{t('analytics.totalRevenue')}</span>
                                <span className="text-lg font-bold text-green-500">
                                    {formatCurrency(platformBreakdown.reduce((sum, p) => sum + p.revenue, 0))}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Tracks Table */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold">{t('analytics.topPerformingTracks')}</h3>
                <DataTable
                    columns={trackColumns}
                    data={topTracks}
                />
            </div>

            {/* Geographic Insights */}
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                <h3 className="text-lg font-bold mb-6">{t('analytics.geographicDistribution')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {topCountries.map((country) => (
                        <div
                            key={country.code}
                            className="bg-gray-800/50 p-4 rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-3xl">
                                    {country.code === 'US' ? '🇺🇸' :
                                        country.code === 'BR' ? '🇧🇷' :
                                            country.code === 'GB' ? '🇬🇧' :
                                                country.code === 'DE' ? '🇩🇪' :
                                                    country.code === 'FR' ? '🇫🇷' : '🌍'}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-white text-sm truncate">
                                        {country.country}
                                    </p>
                                </div>
                            </div>
                            <p className="text-lg font-bold text-white">
                                {formatNumber(country.streams)}
                            </p>
                            <p className="text-xs text-gray-400">
                                {country.percentage}% {t('analytics.ofTotal')}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
