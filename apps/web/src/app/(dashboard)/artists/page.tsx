'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Plus,
  Search,
  Music,
  Edit,
  Trash2,
  Globe,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useArtists } from '@/lib/hooks/use-artists';
import type { Artist, OnboardingStatus } from '@/lib/types';
import { ArtistSheet } from './_components/artist-sheet';
import { DeleteArtistDialog } from './_components/delete-artist-dialog';

const PER_PAGE = 9;

type FilterTab = 'all' | 'active' | 'pending';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'active', label: 'Ativos' },
  { key: 'pending', label: 'Pendentes' },
];

function getStatusBadge(status: OnboardingStatus) {
  switch (status) {
    case 'COMPLETED':
      return {
        label: 'Ativo',
        className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      };
    case 'IN_PROGRESS':
    case 'NOT_STARTED':
      return {
        label: 'Pendente',
        className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      };
    case 'SKIPPED':
      return {
        label: 'Ignorado',
        className: 'bg-muted text-muted-foreground border-border',
      };
    default:
      return {
        label: 'Pendente',
        className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      };
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function useDebounce(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);

  useMemo(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debounced;
}

export default function ArtistsPage() {
  // State
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | undefined>(
    undefined,
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingArtist, setDeletingArtist] = useState<Artist | null>(null);

  const debouncedSearch = useDebounce(searchInput, 300);

  // Query
  const { data, isLoading, isError } = useArtists({
    page,
    perPage: PER_PAGE,
    search: debouncedSearch || undefined,
  });

  const artists = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  // Client-side filter on onboardingStatus
  const filteredArtists = useMemo(() => {
    if (filter === 'all') return artists;
    if (filter === 'active')
      return artists.filter((a) => a.onboardingStatus === 'COMPLETED');
    if (filter === 'pending')
      return artists.filter(
        (a) =>
          a.onboardingStatus === 'NOT_STARTED' ||
          a.onboardingStatus === 'IN_PROGRESS',
      );
    return artists;
  }, [artists, filter]);

  // Handlers
  const handleNewArtist = useCallback(() => {
    setEditingArtist(undefined);
    setSheetOpen(true);
  }, []);

  const handleEditArtist = useCallback((artist: Artist) => {
    setEditingArtist(artist);
    setSheetOpen(true);
  }, []);

  const handleDeleteArtist = useCallback((artist: Artist) => {
    setDeletingArtist(artist);
    setDeleteDialogOpen(true);
  }, []);

  const handleFilterChange = useCallback((tab: FilterTab) => {
    setFilter(tab);
    setPage(1);
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchInput(e.target.value);
      setPage(1);
    },
    [],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Artistas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie seus artistas e catalogo
          </p>
        </div>
        <Button
          onClick={handleNewArtist}
          className="gap-2 glow-orange"
        >
          <Plus className="h-4 w-4" />
          Novo Artista
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2.5 w-full sm:flex-1 sm:max-w-sm px-3 py-2 rounded-lg bg-secondary/60 border border-border/30 focus-within:border-primary/30 transition-all">
          <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <input
            type="search"
            placeholder="Buscar artistas..."
            value={searchInput}
            onChange={handleSearchChange}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
          />
        </div>
        <div className="flex gap-1.5">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleFilterChange(tab.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                filter === tab.key
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card-elevated rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-11 h-11 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && !isLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <Music className="h-6 w-6 text-destructive" />
          </div>
          <h3 className="font-semibold text-lg">Erro ao carregar artistas</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Nao foi possivel carregar a lista de artistas. Verifique sua conexao
            e tente novamente.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && filteredArtists.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg">
            Nenhum artista encontrado
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            {debouncedSearch
              ? `Nenhum resultado para "${debouncedSearch}". Tente outro termo.`
              : 'Comece cadastrando seu primeiro artista.'}
          </p>
          {!debouncedSearch && (
            <Button onClick={handleNewArtist} className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Novo Artista
            </Button>
          )}
        </div>
      )}

      {/* Artists Grid */}
      {!isLoading && !isError && filteredArtists.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredArtists.map((artist) => {
              const status = getStatusBadge(artist.onboardingStatus);
              return (
                <div
                  key={artist.id}
                  className="card-interactive rounded-xl p-5 group"
                >
                  {/* Top: Avatar + Name + Status */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {artist.avatarUrl ? (
                        <img
                          src={artist.avatarUrl}
                          alt={artist.stageName}
                          className="w-11 h-11 rounded-full object-cover ring-2 ring-primary/10"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/80 to-orange-600 flex items-center justify-center text-sm font-bold text-white ring-2 ring-primary/10">
                          {getInitials(artist.stageName)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                          {artist.stageName}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {artist.legalName}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border flex-shrink-0',
                        status.className,
                      )}
                    >
                      {status.label}
                    </span>
                  </div>

                  {/* Info rows */}
                  <div className="space-y-1.5 mb-4">
                    {artist.email && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{artist.email}</span>
                      </div>
                    )}
                    {artist.phone && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{artist.phone}</span>
                      </div>
                    )}
                    {artist.country && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Globe className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">
                          {artist.city
                            ? `${artist.city}, ${artist.country}`
                            : artist.country}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1 pt-3 border-t border-border/30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      onClick={() => handleEditArtist(artist)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteArtist(artist)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Excluir
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Pagina {meta?.page ?? 1} de {totalPages}
                {meta?.total !== undefined && (
                  <span className="ml-1">
                    ({meta.total} artista{meta.total !== 1 ? 's' : ''})
                  </span>
                )}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="gap-1"
                >
                  Proximo
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Sheet (Create / Edit) */}
      <ArtistSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        artist={editingArtist}
      />

      {/* Delete Dialog */}
      <DeleteArtistDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        artist={deletingArtist}
      />
    </div>
  );
}
