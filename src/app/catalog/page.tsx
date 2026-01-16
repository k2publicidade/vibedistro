"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Music, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { catalogReleases } from '@/lib/mockData';
import { formatNumber, formatCurrency, formatDate } from '@/lib/formatters';
import { useTranslation } from '@/hooks/useTranslation';

export default function Catalog() {
    const { t } = useTranslation();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const filteredReleases = useMemo(() => {
        return catalogReleases.filter(release => {
            const matchesSearch = release.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                release.artist.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || release.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [searchTerm, statusFilter]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'live': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'review': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'draft': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
            default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        }
    };

    const totalReleases = catalogReleases.length;
    const liveReleases = catalogReleases.filter(r => r.status === 'live').length;
    const totalStreams = catalogReleases.reduce((sum, r) => sum + r.totalStreams, 0);
    const totalRevenue = catalogReleases.reduce((sum, r) => sum + r.revenue, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-vibeorange-400 to-red-600">
                    {t('catalog.title')}
                </h1>
                <button
                    onClick={() => router.push('/catalog/new')}
                    className="bg-vibeorange-600 hover:bg-vibeorange-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    {t('catalog.createRelease')}
                </button>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                    <div className="flex items-center gap-2 mb-2">
                        <Music className="w-5 h-5 text-vibeorange-500" />
                        <h3 className="text-gray-400 text-sm font-medium">{t('catalog.totalReleases')}</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{totalReleases}</p>
                    <p className="text-xs text-gray-500 mt-1">{liveReleases} {t('catalog.live').toLowerCase()}</p>
                </div>
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        <h3 className="text-gray-400 text-sm font-medium">{t('catalog.totalStreams')}</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{formatNumber(totalStreams)}</p>
                </div>
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-5 h-5 text-green-500" />
                        <h3 className="text-gray-400 text-sm font-medium">{t('catalog.totalRevenue')}</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{formatCurrency(totalRevenue)}</p>
                </div>
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-5 h-5 text-orange-500" />
                        <h3 className="text-gray-400 text-sm font-medium">{t('catalog.avgPerRelease')}</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">
                        {formatCurrency(totalRevenue / totalReleases)}
                    </p>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder={t('catalog.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-vibeorange-500 transition-colors"
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'live', 'review', 'draft'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-3 rounded-lg font-medium transition-colors ${statusFilter === status
                                ? 'bg-vibeorange-600 text-white'
                                : 'bg-gray-900 text-gray-400 border border-gray-800 hover:border-gray-700'
                                }`}
                        >
                            {t(`catalog.${status}`)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Releases Grid */}
            {filteredReleases.length === 0 ? (
                <div className="text-center py-20 bg-gray-900 rounded-lg border border-gray-800">
                    <Music className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">
                        {searchTerm || statusFilter !== 'all'
                            ? t('catalog.noReleasesMatchingCriteria')
                            : t('catalog.noReleasesFound')}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredReleases.map((release) => (
                        <div
                            key={release.id}
                            className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden hover:border-vibeorange-500 transition-all group"
                        >
                            {/* Artwork */}
                            <div className="aspect-square bg-gradient-to-br from-vibeorange-600 to-red-600 relative overflow-hidden">
                                <div className="absolute inset-0 flex items-center justify-center text-white">
                                    <Music className="w-16 h-16 opacity-50 group-hover:scale-110 transition-transform" />
                                </div>
                                <div className="absolute top-3 right-3">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(release.status)}`}>
                                        {t(`catalog.${release.status}`).toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <h3 className="font-bold text-white text-lg mb-1 truncate group-hover:text-vibeorange-400 transition-colors">
                                    {release.title}
                                </h3>
                                <p className="text-sm text-gray-400 mb-1 truncate">{release.artist}</p>
                                <p className="text-xs text-gray-500 mb-4">
                                    {formatDate(release.releaseDate)} • {release.tracksCount} {t('catalog.tracks')}
                                </p>

                                {/* Metrics */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="bg-gray-800/50 rounded-lg p-3">
                                        <p className="text-xs text-gray-400 mb-1">{t('catalog.streams')}</p>
                                        <p className="text-sm font-bold text-white">
                                            {formatNumber(release.totalStreams)}
                                        </p>
                                    </div>
                                    <div className="bg-gray-800/50 rounded-lg p-3">
                                        <p className="text-xs text-gray-400 mb-1">{t('catalog.revenue')}</p>
                                        <p className="text-sm font-bold text-green-500">
                                            {formatCurrency(release.revenue)}
                                        </p>
                                    </div>
                                </div>

                                {/* UPC */}
                                <div className="pt-3 border-t border-gray-800">
                                    <p className="text-xs text-gray-500">
                                        UPC: <span className="text-gray-400 font-mono">{release.upc}</span>
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="mt-4 flex gap-2">
                                    <button
                                        onClick={() => router.push(`/catalog/${release.id}`)}
                                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                    >
                                        {t('common.viewDetails')}
                                    </button>
                                    <button
                                        onClick={() => router.push(`/catalog/${release.id}/edit`)}
                                        className="bg-vibeorange-600 hover:bg-vibeorange-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                    >
                                        {t('common.edit')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
