"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Music, ArrowLeft, ArrowRight, Check, Trash2, Upload } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function NewRelease() {
    const { t } = useTranslation();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [metadata, setMetadata] = useState({
        title: '',
        artist: '',
        genre: '',
        releaseDate: '',
    });
    const [tracks, setTracks] = useState([{ id: '1', title: '', isrc: '' }]);

    const nextStep = () => setStep(s => Math.min(s + 1, 3));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const handleAddTrack = () => {
        setTracks([...tracks, { id: Math.random().toString(36).substr(2, 9), title: '', isrc: '' }]);
    };

    const handleRemoveTrack = (id: string) => {
        if (tracks.length > 1) {
            setTracks(tracks.filter(t => t.id !== id));
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-gray-400" />
                </button>
                <h1 className="text-3xl font-bold text-white">{t('catalog.createRelease')}</h1>
            </div>

            {/* Stepper */}
            <div className="flex items-center justify-between mb-12 relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-800 -translate-y-1/2 z-0" />
                {[1, 2, 3].map((s) => (
                    <div key={s} className="relative z-10 flex flex-col items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${step >= s ? 'bg-vibeorange-600 text-white' : 'bg-gray-800 text-gray-500'
                            }`}>
                            {step > s ? <Check className="w-6 h-6" /> : s}
                        </div>
                        <span className={`text-xs font-medium ${step >= s ? 'text-white' : 'text-gray-500'}`}>
                            {s === 1 ? t('catalog.steps.metadata') : s === 2 ? t('catalog.steps.tracks') : t('catalog.steps.review')}
                        </span>
                    </div>
                ))}
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">{t('catalog.title')}</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-vibeorange-500"
                                    placeholder="Ex: Summer Vibes"
                                    value={metadata.title}
                                    onChange={e => setMetadata({ ...metadata, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">{t('catalog.mainArtist')}</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-vibeorange-500"
                                    value={metadata.artist}
                                    onChange={e => setMetadata({ ...metadata, artist: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">{t('catalog.genre')}</label>
                                <select
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-vibeorange-500"
                                    value={metadata.genre}
                                    onChange={e => setMetadata({ ...metadata, genre: e.target.value })}
                                >
                                    <option value="">Select Genre</option>
                                    <option value="pop">Pop</option>
                                    <option value="rock">Rock</option>
                                    <option value="electronic">Electronic</option>
                                    <option value="hiphop">Hip Hop</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">{t('catalog.releaseDate')}</label>
                                <input
                                    type="date"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-vibeorange-500"
                                    value={metadata.releaseDate}
                                    onChange={e => setMetadata({ ...metadata, releaseDate: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {tracks.map((track, index) => (
                            <div key={track.id} className="flex gap-4 items-end bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                                <div className="flex-1 space-y-2">
                                    <label className="text-xs font-medium text-gray-500 uppercase">Track {index + 1}</label>
                                    <input
                                        type="text"
                                        placeholder="Track Title"
                                        className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-white focus:outline-none focus:border-vibeorange-500"
                                    />
                                </div>
                                <div className="w-48 space-y-2">
                                    <label className="text-xs font-medium text-gray-500 uppercase">ISRC</label>
                                    <input
                                        type="text"
                                        placeholder="US-XXX-XX-XXXXX"
                                        className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-white focus:outline-none focus:border-vibeorange-500"
                                    />
                                </div>
                                <button
                                    onClick={() => handleRemoveTrack(track.id)}
                                    className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={handleAddTrack}
                            className="w-full py-4 border-2 border-dashed border-gray-800 rounded-lg text-gray-500 hover:border-vibeorange-500 hover:text-vibeorange-500 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            {t('catalog.addTrack')}
                        </button>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex gap-8">
                            <div className="w-48 h-48 bg-gray-800 rounded-lg relative overflow-hidden group cursor-pointer border-2 border-dashed border-gray-700 hover:border-vibeorange-500 transition-colors">
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 group-hover:text-vibeorange-500">
                                    <Upload className="w-8 h-8 mb-2" />
                                    <span className="text-xs font-bold">Capa (3000x3000px)</span>
                                </div>
                            </div>
                            <div className="flex-1 space-y-4">
                                <h3 className="text-xl font-bold text-white uppercase tracking-wider">{metadata.title || 'Untitled Release'}</h3>
                                <p className="text-gray-400">{metadata.artist || 'Unknown Artist'}</p>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-tighter">Genre</p>
                                        <p className="text-sm text-white capitalize">{metadata.genre || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-tighter">Tracks</p>
                                        <p className="text-sm text-white">{tracks.length}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-800/10 p-4 rounded border border-gray-700/50">
                            <p className="text-sm text-gray-400 italic">
                                * Ao finalizar, seu lançamento entrará em revisão pela nossa equipe. O processo leva em média 24-48 horas úteis.
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex justify-between mt-12 pt-8 border-t border-gray-800">
                    <button
                        onClick={prevStep}
                        disabled={step === 1}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <ArrowLeft className="w-5 h-5" />
                        {t('catalog.actions.back')}
                    </button>

                    {step < 3 ? (
                        <button
                            onClick={nextStep}
                            className="bg-vibeorange-600 hover:bg-vibeorange-700 text-white px-8 py-2 rounded-lg font-bold transition-all flex items-center gap-2"
                        >
                            {t('catalog.actions.next')}
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            onClick={() => router.push('/catalog')}
                            className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-lg font-bold transition-all flex items-center gap-2 shadow-lg shadow-green-900/20"
                        >
                            <Check className="w-5 h-5" />
                            {t('catalog.actions.submit')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
