'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Upload,
  Music,
  Image as ImageIcon,
  X,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { useArtists } from '@/lib/hooks/use-artists';
import { useCreateRelease, useUpdateRelease } from '@/lib/hooks/use-releases';
import { useCreateTrack } from '@/lib/hooks/use-tracks';
import { useUploadAsset, type UploadedAsset } from '@/lib/hooks/use-assets';
import type { ReleaseType } from '@/lib/types';

// ---- Constants ----

const RELEASE_TYPES: { value: ReleaseType; label: string }[] = [
  { value: 'SINGLE', label: 'Single' },
  { value: 'EP', label: 'EP' },
  { value: 'ALBUM', label: 'Album' },
  { value: 'COMPILATION', label: 'Compilacao' },
  { value: 'MIXTAPE', label: 'Mixtape' },
  { value: 'LIVE', label: 'Live' },
  { value: 'REMIX', label: 'Remix' },
  { value: 'SOUNDTRACK', label: 'Trilha Sonora' },
];

const GENRES = [
  'Pop', 'Rock', 'Hip-Hop/Rap', 'R&B/Soul', 'Electronic', 'Dance',
  'Jazz', 'Classical', 'Country', 'Latin', 'Reggae', 'Blues',
  'Folk', 'Metal', 'Punk', 'Indie', 'Alternative', 'World',
  'Gospel', 'Funk', 'Sertanejo', 'MPB', 'Forro', 'Pagode', 'Samba',
];

// ---- Track item ----

interface TrackItem {
  id: string;
  file: File;
  title: string;
  asset: UploadedAsset | null;
  uploading: boolean;
  progress: number;
  error: string | null;
}

// ---- Page ----

export default function NewReleasePage() {
  const router = useRouter();
  const createRelease = useCreateRelease();
  const updateRelease = useUpdateRelease();
  const createTrack = useCreateTrack();
  const { data: artistsData } = useArtists({ perPage: 100 });
  const artists = artistsData?.data ?? [];

  // Form state
  const [title, setTitle] = useState('');
  const [artistId, setArtistId] = useState('');
  const [releaseType, setReleaseType] = useState<ReleaseType>('SINGLE');
  const [genre, setGenre] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [explicit, setExplicit] = useState(false);
  const [cLine, setCLine] = useState('');
  const [pLine, setPLine] = useState('');

  // Cover upload
  const coverUpload = useUploadAsset();
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Tracks
  const [tracks, setTracks] = useState<TrackItem[]>([]);
  const trackInputRef = useRef<HTMLInputElement>(null);

  // Submitting
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ---- Cover handlers ----

  const handleCoverSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (ev) => setCoverPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    await coverUpload.upload(file, 'COVER_ART');
  }, [coverUpload]);

  const removeCover = useCallback(() => {
    setCoverPreview(null);
    coverUpload.reset();
    if (coverInputRef.current) coverInputRef.current.value = '';
  }, [coverUpload]);

  // ---- Track handlers ----

  const handleTracksSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const newTracks: TrackItem[] = files.map((file, i) => ({
      id: `${Date.now()}-${i}`,
      file,
      title: file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '),
      asset: null,
      uploading: true,
      progress: 0,
      error: null,
    }));

    setTracks((prev) => [...prev, ...newTracks]);

    // Upload each track sequentially
    for (const track of newTracks) {
      try {
        const formData = new FormData();
        formData.append('file', track.file);

        const token = localStorage.getItem('token');
        const API_BASE = '/api/v1';

        const result = await new Promise<UploadedAsset>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', `${API_BASE}/assets/upload?assetType=AUDIO`);
          if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

          xhr.upload.addEventListener('progress', (ev) => {
            if (ev.lengthComputable) {
              const pct = Math.round((ev.loaded / ev.total) * 100);
              setTracks((prev) =>
                prev.map((t) => (t.id === track.id ? { ...t, progress: pct } : t)),
              );
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              const body = JSON.parse(xhr.responseText || '{}');
              reject(new Error(body?.message ?? `HTTP ${xhr.status}`));
            }
          });
          xhr.addEventListener('error', () => reject(new Error('Upload falhou')));

          xhr.send(formData);
        });

        setTracks((prev) =>
          prev.map((t) =>
            t.id === track.id
              ? { ...t, asset: result, uploading: false, progress: 100 }
              : t,
          ),
        );
      } catch (err: any) {
        setTracks((prev) =>
          prev.map((t) =>
            t.id === track.id
              ? { ...t, uploading: false, error: err?.message ?? 'Erro' }
              : t,
          ),
        );
      }
    }

    if (trackInputRef.current) trackInputRef.current.value = '';
  }, []);

  const removeTrack = useCallback((id: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateTrackTitle = useCallback((id: string, newTitle: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title: newTitle } : t)),
    );
  }, []);

  // ---- Submit ----

  const canSubmit =
    title.trim() && artistId && !submitting && !coverUpload.uploading && !tracks.some((t) => t.uploading);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const release = await createRelease.mutateAsync({
        title: title.trim(),
        artistId,
        releaseType,
        genre: genre || undefined,
        releaseDate: releaseDate || undefined,
        explicit,
        cLine: cLine || undefined,
        pLine: pLine || undefined,
      });

      // Link cover art to release
      if (coverUpload.asset?.id) {
        await updateRelease.mutateAsync({
          id: release.id,
          coverAssetId: coverUpload.asset.id,
        } as any);
      }

      // Create tracks linked to release
      const uploadedTracks = tracks.filter((t) => t.asset && !t.error);
      for (let i = 0; i < uploadedTracks.length; i++) {
        const t = uploadedTracks[i]!;
        await createTrack.mutateAsync({
          title: t.title,
          tenantId: release.tenantId,
          releaseId: release.id,
          audioAssetId: t.asset!.id,
          trackNumber: i + 1,
        } as any);
      }

      router.push('/releases');
    } catch (err: any) {
      setSubmitError(err?.message ?? 'Erro ao criar release');
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Render ----

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Novo Release</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Preencha as informacoes e faca upload dos arquivos
          </p>
        </div>
      </div>

      {/* Cover Art */}
      <section className="space-y-3">
        <Label className="text-base font-semibold">Capa do Release</Label>
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'relative w-40 h-40 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors overflow-hidden',
              coverPreview
                ? 'border-primary/30'
                : 'border-border hover:border-primary/40 hover:bg-secondary/40',
            )}
            onClick={() => coverInputRef.current?.click()}
          >
            {coverPreview ? (
              <img
                src={coverPreview}
                alt="Capa"
                className="w-full h-full object-cover"
              />
            ) : coverUpload.uploading ? (
              <div className="text-center space-y-2">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                <p className="text-xs text-muted-foreground">{coverUpload.progress}%</p>
              </div>
            ) : (
              <div className="text-center space-y-2 p-4">
                <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  JPEG, PNG ou WebP
                  <br />
                  Min. 3000x3000px
                </p>
              </div>
            )}
            {coverPreview && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeCover();
                }}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            )}
          </div>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleCoverSelect}
          />
          <div className="text-sm text-muted-foreground space-y-1 pt-2">
            {coverUpload.asset && (
              <p className="flex items-center gap-1.5 text-emerald-500">
                <CheckCircle2 className="h-4 w-4" />
                Upload concluido
              </p>
            )}
            {coverUpload.error && (
              <p className="flex items-center gap-1.5 text-destructive">
                <AlertCircle className="h-4 w-4" />
                {coverUpload.error}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Release Info */}
      <section className="space-y-4">
        <Label className="text-base font-semibold">Informacoes do Release</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label htmlFor="title">Titulo *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome do release"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="artist">Artista *</Label>
            <Select value={artistId} onValueChange={setArtistId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Selecione o artista" />
              </SelectTrigger>
              <SelectContent>
                {artists.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.stageName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="type">Tipo</Label>
            <Select value={releaseType} onValueChange={(v) => setReleaseType(v as ReleaseType)}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RELEASE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="genre">Genero</Label>
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {GENRES.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="releaseDate">Data de Lancamento</Label>
            <Input
              id="releaseDate"
              type="date"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="cLine">Copyright (C)</Label>
            <Input
              id="cLine"
              value={cLine}
              onChange={(e) => setCLine(e.target.value)}
              placeholder="2026 Label Name"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="pLine">Copyright (P)</Label>
            <Input
              id="pLine"
              value={pLine}
              onChange={(e) => setPLine(e.target.value)}
              placeholder="2026 Label Name"
              className="mt-1.5"
            />
          </div>

          <div className="flex items-center gap-3 pt-5">
            <Switch
              id="explicit"
              checked={explicit}
              onCheckedChange={setExplicit}
            />
            <Label htmlFor="explicit" className="cursor-pointer">
              Conteudo explicito
            </Label>
          </div>
        </div>
      </section>

      {/* Tracks */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Faixas</Label>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => trackInputRef.current?.click()}
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar Faixa
          </Button>
          <input
            ref={trackInputRef}
            type="file"
            accept="audio/*"
            multiple
            className="hidden"
            onChange={handleTracksSelect}
          />
        </div>

        {tracks.length === 0 ? (
          <div
            className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-secondary/20 transition-colors"
            onClick={() => trackInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              Arraste arquivos de audio ou clique para selecionar
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              WAV, FLAC, MP3, AAC, AIFF - max 200MB por arquivo
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {tracks.map((track, i) => (
              <div
                key={track.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40 border border-border/30"
              >
                <span className="text-xs text-muted-foreground tabular-nums w-6 text-center">
                  {i + 1}
                </span>
                <Music className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Input
                    value={track.title}
                    onChange={(e) => updateTrackTitle(track.id, e.target.value)}
                    className="h-8 text-sm bg-transparent border-0 px-0 focus-visible:ring-0"
                  />
                  {track.uploading && (
                    <Progress value={track.progress} className="h-1 mt-1" />
                  )}
                  {track.error && (
                    <p className="text-xs text-destructive mt-1">{track.error}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {track.uploading && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  )}
                  {track.asset && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  )}
                  {track.error && (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {(track.file.size / (1024 * 1024)).toFixed(1)}MB
                  </span>
                  <button
                    onClick={() => removeTrack(track.id)}
                    className="p-1 rounded-md hover:bg-secondary transition-colors"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Submit */}
      {submitError && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {submitError}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button
          disabled={!canSubmit}
          onClick={handleSubmit}
          className="gap-2 glow-orange min-w-[140px]"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Criando...
            </>
          ) : (
            'Criar Release'
          )}
        </Button>
      </div>
    </div>
  );
}
