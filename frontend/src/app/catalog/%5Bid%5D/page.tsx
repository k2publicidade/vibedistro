"use client";

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Music, Play, Edit2, Share2, DollarSign, TrendingUp, Info } from 'lucide-react';
import { catalogReleases } from '@/lib/mockData';
import { formatNumber, formatCurrency, formatDate } from '@/lib/formatters';
import { useTranslation } from '@/hooks/useTranslation';

export default function ReleaseDetails({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { t } = useTranslation();
    const router = useRouter();

    const release = catalogReleases.find(r => r.id === id);

    if (!release) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Info className="w-12 h-12 mb-4" />
                <p>Release not found</p>
                <button onClick={() => router.push('/catalog')} className="mt-4 text-vibeorange-500 hover:underline">
                    Back to Catalog
                </button>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'live': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'review': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'draft': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
            default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Navigation & Actions */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    {t('catalog.actions.back')}
                </button>
                <div className="flex gap-3">
                    <button className="p-2 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-700 text-gray-400 hover:text-white transition-all">
                        <Share2 className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => router.push(`/catalog/${id}/edit`)}
                        className="flex items-center gap-2 bg-vibeorange-600 hover:bg-vibeorange-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
                    >
                        <Edit2 className="w-4 h-4" />
                        {t('common.edit')}
                    </button>
                </div>
            </div>

            {/* Banner Section */}
            <div className="relative overflow-hidden rounded-2xl bg-gray-900 border border-gray-800 p-8">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-vibeorange-600/10 to-transparent pointer-events-none" />

                <div className="flex flex-col md:flex-row gap-8 relative z-10">
                    <div className="w-64 h-64 flex-shrink-0 bg-gradient-to-br from-vibeorange-600 to-red-600 rounded-xl shadow-2xl overflow-hidden group">
                        <div className="absolute inset-0 flex items-center justify-center text-white opacity-20 group-hover:opacity-40 transition-opacity">
                            <Music className="w-24 h-24" />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="bg-white/20 backdrop-blur-md p-4 rounded-full text-white hover:scale-110 transition-transform">
                                <Play className="w-8 h-8 fill-current" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-end space-y-4">
                        <div className="space-y-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(release.status)}`}>
                                {t(`catalog.${release.status}`).toUpperCase()}
                            </span>
                            <h1 className="text-4xl md:text-5xl font-black text-white">{release.title}</h1>
                            <p className="text-xl text-gray-400 font-medium">{release.artist}</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-800/50">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-widest">{t('catalog.releaseDate')}</p>
                                <p className="text-white font-medium">{formatDate(release.releaseDate)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-widest">{t('catalog.upc')}</p>
                                <p className="text-white font-mono">{release.upc}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-widest">{t('catalog.genre')}</p>
                                <p className="text-white font-medium capitalize">Electronic</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-widest">{t('catalog.tracks')}</p>
                                <p className="text-white font-medium">{release.tracks?.length || release.tracksCount}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Tabs/Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Tracklist */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold text-white tracking-tight">{t('catalog.tracklist')}</h2>
                        <span className="text-sm text-gray-500">{release.tracks?.length || release.tracksCount} {t('catalog.tracks')}</span>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-800/50 text-gray-500 text-xs uppercase tracking-tighter">
                                    <tr>
                                        <th className="px-6 py-4 font-bold">#</th>
                                        <th className="px-6 py-4 font-bold">{t('analytics.track')}</th>
                                        <th className="px-6 py-4 font-bold">{t('catalog.isrc')}</th>
                                        <th className="px-6 py-4 font-bold text-right">{t('catalog.duration')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {release.tracks?.map((track, index) => (
                                        <tr key={track.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4 text-gray-500 font-medium">{index + 1}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-white font-medium group-hover:text-vibeorange-400 transition-colors">
                                                        {track.title}
                                                    </span>
                                                    {track.explicit && (
                                                        <span className="text-[10px] bg-red-500/10 text-red-500 border border-red-500/20 px-1 rounded w-fit mt-1 font-bold">EXPLICIT</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-400 font-mono text-sm">{track.isrc}</td>
                                            <td className="px-6 py-4 text-gray-400 text-right text-sm">{track.duration}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white tracking-tight px-2">Performance</h2>

                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-gray-400 text-sm">
                                <span className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-blue-500" />
                                    Total Streams
                                </span>
                            </div>
                            <p className="text-3xl font-black text-white">{formatNumber(release.totalStreams)}</p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-gray-400 text-sm">
                                <span className="flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-green-500" />
                                    Total Revenue
                                </span>
                            </div>
                            <p className="text-3xl font-black text-green-500">{formatCurrency(release.revenue)}</p>
                        </div>

                        <div className="pt-6 border-t border-gray-800">
                            <button className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg font-bold transition-colors">
                                {t('nav.analytics')}
                            </button>
                        </div>
                    </div>

                    <div className="bg-vibeorange-600/10 border border-vibeorange-500/20 rounded-xl p-6">
                        <h4 className="text-vibeorange-400 font-bold mb-2">Need to edit?</h4>
                        <p className="text-sm text-gray-300 leading-relaxed mb-4">
                            You can update metadata and manage tracks as long as the release is in 'Draft' or 'Review' status.
                        </p>
                        <button className="text-white text-sm font-bold underline decoration-vibeorange-500 underline-offset-4">
                            Learn more about editing
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
