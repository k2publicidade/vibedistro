"use client";

import { TrendingUp, DollarSign, Music, Users, Globe, Activity } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { LineChart } from '@/components/Chart';
import {
    dashboardMetrics,
    streamingData,
    topReleases,
    topCountries,
    recentActivity
} from '@/lib/mockData';
import { formatNumber, formatCurrency, formatCompactDate } from '@/lib/formatters';
import { useTranslation } from '@/hooks/useTranslation';

export default function Dashboard() {
    const { t } = useTranslation();
    const chartData = streamingData.map(d => ({
        date: d.date,
        value: d.streams,
    }));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-vibeorange-400 to-red-600">
                    {t('dashboard.title')}
                </h1>
                <div className="text-sm text-gray-400">
                    {t('dashboard.lastUpdated')}: {new Date().toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title={t('dashboard.totalStreams')}
                    value={dashboardMetrics.totalStreams}
                    change={dashboardMetrics.streamsChange}
                    icon={TrendingUp}
                    format="number"
                />
                <StatCard
                    title={t('dashboard.revenue')}
                    value={dashboardMetrics.revenue}
                    change={dashboardMetrics.revenueChange}
                    icon={DollarSign}
                    format="currency"
                />
                <StatCard
                    title={t('dashboard.activeReleases')}
                    value={dashboardMetrics.activeReleases}
                    icon={Music}
                    format="none"
                    subtitle={`${dashboardMetrics.pendingReleases} ${t('dashboard.pending')}`}
                />
                <StatCard
                    title={t('dashboard.monthlyListeners')}
                    value={dashboardMetrics.monthlyListeners}
                    change={dashboardMetrics.listenersChange}
                    icon={Users}
                    format="number"
                />
            </div>

            {/* Performance Chart */}
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold">{t('dashboard.streamingPerformance')}</h3>
                    <span className="text-sm text-gray-400">{t('dashboard.last30Days')}</span>
                </div>
                <LineChart data={chartData} height={250} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Releases */}
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                    <div className="flex items-center gap-2 mb-4">
                        <Music className="w-5 h-5 text-vibeorange-500" />
                        <h3 className="text-lg font-bold">{t('dashboard.topReleases')}</h3>
                    </div>
                    <div className="space-y-4">
                        {topReleases.map((release, index) => (
                            <div
                                key={release.id}
                                className="flex items-center gap-4 p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
                            >
                                <div className="flex-shrink-0 w-12 h-12 rounded-md bg-gradient-to-br from-vibeorange-500 to-red-600 flex items-center justify-center text-white font-bold">
                                    #{index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-white truncate">{release.title}</h4>
                                    <p className="text-sm text-gray-400 truncate">{release.artist}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-white">
                                        {formatNumber(release.streams)}
                                    </p>
                                    <p className={`text-xs font-medium ${release.change >= 0 ? 'text-green-500' : 'text-red-500'
                                        }`}>
                                        {release.change >= 0 ? '+' : ''}{release.change.toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Geographic Distribution */}
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                    <div className="flex items-center gap-2 mb-4">
                        <Globe className="w-5 h-5 text-blue-500" />
                        <h3 className="text-lg font-bold">{t('dashboard.topMarkets')}</h3>
                    </div>
                    <div className="space-y-4">
                        {topCountries.map((country) => (
                            <div key={country.code} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{country.code === 'US' ? '🇺🇸' :
                                            country.code === 'BR' ? '🇧🇷' :
                                                country.code === 'GB' ? '🇬🇧' :
                                                    country.code === 'DE' ? '🇩🇪' :
                                                        country.code === 'FR' ? '🇫🇷' : '🌍'}</span>
                                        <div>
                                            <p className="font-medium text-white">{country.country}</p>
                                            <p className="text-sm text-gray-400">
                                                {formatNumber(country.streams)} {t('dashboard.streams')}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-medium text-vibeorange-500">
                                        {country.percentage}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-800 rounded-full h-2">
                                    <div
                                        className="bg-gradient-to-r from-vibeorange-500 to-red-600 h-2 rounded-full transition-all"
                                        style={{ width: `${country.percentage}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5 text-green-500" />
                    <h3 className="text-lg font-bold">{t('dashboard.recentActivity')}</h3>
                </div>
                <div className="space-y-4">
                    {recentActivity.map((activity) => (
                        <div
                            key={activity.id}
                            className="flex items-start gap-4 pb-4 border-b border-gray-800 last:border-0 last:pb-0"
                        >
                            <div className={`w-2 h-2 rounded-full mt-2 ${activity.type === 'distribution' ? 'bg-blue-500' :
                                activity.type === 'milestone' ? 'bg-green-500' :
                                    'bg-yellow-500'
                                }`} />
                            <div className="flex-1">
                                <p className="text-sm text-white">{activity.message}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {formatCompactDate(activity.timestamp)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
