"use client";

import { Send, Plus, CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';
import { platforms, distributionReleases, distributionTimeline } from '@/lib/mockData';
import { formatDate, formatCompactDate } from '@/lib/formatters';
import { useTranslation } from '@/hooks/useTranslation';

export default function Distribution() {
    const { t } = useTranslation();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'live': return 'text-green-500 bg-green-500/10';
            case 'pending': return 'text-yellow-500 bg-yellow-500/10';
            case 'review': return 'text-blue-500 bg-blue-500/10';
            case 'rejected': return 'text-red-500 bg-red-500/10';
            default: return 'text-gray-500 bg-gray-500/10';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'live': return <CheckCircle className="w-4 h-4" />;
            case 'pending': return <Clock className="w-4 h-4" />;
            case 'review': return <Clock className="w-4 h-4" />;
            case 'rejected': return <XCircle className="w-4 h-4" />;
            default: return null;
        }
    };

    const liveCount = distributionReleases.reduce((count, release) =>
        count + Object.values(release.status).filter(s => s === 'live').length, 0
    );

    const pendingCount = distributionReleases.reduce((count, release) =>
        count + Object.values(release.status).filter(s => s === 'pending' || s === 'review').length, 0
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-vibeorange-400 to-red-600">
                    {t('distribution.title')}
                </h1>
                <button className="bg-vibeorange-600 hover:bg-vibeorange-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    {t('distribution.newDistribution')}
                </button>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                    <div className="flex items-center gap-2 mb-2">
                        <Send className="w-5 h-5 text-vibeorange-500" />
                        <h3 className="text-gray-400 text-sm font-medium">{t('distribution.totalDistributions')}</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{liveCount + pendingCount}</p>
                </div>
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <h3 className="text-gray-400 text-sm font-medium">{t('distribution.live')}</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{liveCount}</p>
                </div>
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-yellow-500" />
                        <h3 className="text-gray-400 text-sm font-medium">{t('distribution.pending')}</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{pendingCount}</p>
                </div>
            </div>

            {/* Available Platforms */}
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                <h3 className="text-lg font-bold mb-6">{t('distribution.availablePlatforms')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                    {platforms.map((platform) => (
                        <div
                            key={platform.id}
                            className={`p-4 rounded-lg border transition-all cursor-pointer ${platform.status === 'active'
                                ? 'bg-gray-800/50 border-gray-700 hover:border-vibeorange-500'
                                : 'bg-gray-800/20 border-gray-800 opacity-50'
                                }`}
                        >
                            <div className="text-center">
                                <div className="text-3xl mb-2">{platform.logo}</div>
                                <p className="text-xs font-medium text-white truncate">
                                    {platform.name}
                                </p>
                                <div className="mt-2">
                                    <span className={`inline-block w-2 h-2 rounded-full ${platform.status === 'active' ? 'bg-green-500' : 'bg-gray-600'
                                        }`} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Distribution Status by Release */}
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                <h3 className="text-lg font-bold mb-6">{t('distribution.distributionStatus')}</h3>
                <div className="space-y-6">
                    {distributionReleases.map((release) => (
                        <div key={release.id} className="border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h4 className="font-bold text-white text-lg">{release.title}</h4>
                                    <p className="text-sm text-gray-400">{release.artist}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {t('distribution.released')}: {formatDate(release.releaseDate, 'long')}
                                    </p>
                                </div>
                                <button className="text-vibeorange-500 hover:text-vibeorange-400 text-sm font-medium">
                                    {t('common.manage')}
                                </button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                {Object.entries(release.status).map(([platformId, status]) => {
                                    const platform = platforms.find(p => p.id === platformId);
                                    if (!platform) return null;

                                    return (
                                        <div
                                            key={platformId}
                                            className="bg-gray-800/50 rounded-lg p-3 text-center"
                                        >
                                            <div className="text-2xl mb-2">{platform.logo}</div>
                                            <p className="text-xs text-gray-400 mb-2 truncate">
                                                {platform.name}
                                            </p>
                                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(status as string)}`}>
                                                {getStatusIcon(status as string)}
                                                <span className="capitalize">{t(`distribution.status.${status}`)}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Distribution Timeline */}
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                <h3 className="text-lg font-bold mb-6">{t('distribution.recentActivity')}</h3>
                <div className="space-y-4">
                    {distributionTimeline.map((item) => (
                        <div key={item.id} className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <div className={`w-3 h-3 rounded-full ${item.event.includes('Approved') ? 'bg-green-500' :
                                    item.event.includes('Rejected') ? 'bg-red-500' :
                                        item.event.includes('Complete') ? 'bg-vibeorange-500' :
                                            'bg-blue-500'
                                    }`} />
                                <div className="w-0.5 h-full bg-gray-800 mt-2" />
                            </div>
                            <div className="flex-1 pb-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-white">{item.event}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {item.release} • {item.platform}
                                        </p>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {formatCompactDate(item.date)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
