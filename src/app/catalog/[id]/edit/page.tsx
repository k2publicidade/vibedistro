"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, Trash2, Music, AlertCircle } from 'lucide-react';
import { catalogReleases } from '@/lib/mockData';
import { useTranslation } from '@/hooks/useTranslation';

export default function EditRelease({ params }: { params: { id: string } }) {
    const { id } = params;
    const { t } = useTranslation();
    const router = useRouter();

    const [metadata, setMetadata] = useState({
        title: '',
        artist: '',
        genre: '',
        releaseDate: '',
        upc: ''
    });
    const [tracks, setTracks] = useState<{ id: string, title: string, isrc: string, explicit: boolean }[]>([]);

    useEffect(() => {
        const release = catalogReleases.find(r => r.id === id);
        if (release) {
            setMetadata({
                title: release.title,
                artist: release.artist,
                genre: 'Electronic', // Mocking genre
                releaseDate: release.releaseDate,
                upc: release.upc
            });
            setTracks(release.tracks || []);
        }
    }, [id]);

    const handleAddTrack = () => {
        setTracks([...tracks, { id: Math.random().toString(36).substr(2, 9), title: '', isrc: '', explicit: false }]);
    };

    const handleRemoveTrack = (trackId: string) => {
        setTracks(tracks.filter(t => t.id !== trackId));
    };

    const handleSave = () => {
        // Here we would ideally update the mock/API
        router.push(`/catalog/${id}`);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-400" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-white">{t('catalog.editRelease')}</h1>
                        <p className="text-gray-500 text-sm">{metadata.title}</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    className="bg-vibeorange-600 hover:bg-vibeorange-700 text-white px-6 py-2 rounded-lg font-bold transition-all flex items-center gap-2 shadow-lg shadow-vibeorange-900/20"
                >
                    <Save className="w-5 h-5" />
                    {t('common.save')}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Metadata */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Music className="w-5 h-5 text-vibeorange-500" />
                            {t('catalog.steps.metadata')}
                        </h2>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">{t('catalog.title')}</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-vibeorange-500 transition-colors"
                                    value={metadata.title}
                                    onChange={e => setMetadata({ ...metadata, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">{t('catalog.mainArtist')}</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-vibeorange-500 transition-colors"
                                    value={metadata.artist}
                                    onChange={e => setMetadata({ ...metadata, artist: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">{t('catalog.upc')}</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-vibeorange-500 transition-colors"
                                    value={metadata.upc}
                                    onChange={e => setMetadata({ ...metadata, upc: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-600/5 border border-blue-500/20 rounded-xl p-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-blue-400">Metadata Lock</p>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    Significant changes to artist names or titles after distribution may require a takedown and redelivery.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Tracklist Management */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-white">{t('catalog.tracklist')}</h2>
                            <button
                                onClick={handleAddTrack}
                                className="text-vibeorange-500 hover:text-vibeorange-400 text-sm font-bold flex items-center gap-1 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                {t('catalog.addTrack')}
                            </button>
                        </div>

                        <div className="space-y-3">
                            {tracks.map((track, index) => (
                                <div key={track.id} className="group flex items-center gap-4 bg-gray-800/30 hover:bg-gray-800/50 p-3 rounded-lg border border-gray-700/50 transition-all">
                                    <div className="w-8 text-center text-xs font-bold text-gray-600">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            className="w-full bg-transparent border-none p-0 text-white font-medium focus:ring-0 placeholder-gray-600"
                                            value={track.title}
                                            placeholder="Track Title"
                                            onChange={e => {
                                                const newTracks = [...tracks];
                                                newTracks[index].title = e.target.value;
                                                setTracks(newTracks);
                                            }}
                                        />
                                    </div>
                                    <div className="w-40">
                                        <input
                                            type="text"
                                            className="w-full bg-transparent border-none p-0 text-gray-400 font-mono text-xs focus:ring-0 placeholder-gray-700"
                                            value={track.isrc}
                                            placeholder="ISRC Code"
                                            onChange={e => {
                                                const newTracks = [...tracks];
                                                newTracks[index].isrc = e.target.value;
                                                setTracks(newTracks);
                                            }}
                                        />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={track.explicit}
                                                className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-vibeorange-600 focus:ring-vibeorange-500 focus:ring-offset-gray-900"
                                                onChange={e => {
                                                    const newTracks = [...tracks];
                                                    newTracks[index].explicit = e.target.checked;
                                                    setTracks(newTracks);
                                                }}
                                            />
                                            <span className="text-[10px] font-bold text-gray-500 uppercase">Explicit</span>
                                        </label>
                                        <button
                                            onClick={() => handleRemoveTrack(track.id)}
                                            className="p-1.5 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {tracks.length === 0 && (
                            <div className="py-12 text-center border-2 border-dashed border-gray-800 rounded-xl">
                                <Music className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                                <p className="text-gray-500 text-sm">No tracks in this release yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
