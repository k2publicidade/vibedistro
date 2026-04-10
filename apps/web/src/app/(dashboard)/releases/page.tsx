'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Disc3,
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useReleases, type ReleaseListParams } from '@/lib/hooks/use-releases';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ReleaseStatus, Release } from '@/lib/types';

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  DRAFT: {
    label: 'Rascunho',
    className: 'bg-[#6b7280]/15 text-[#9ca3af] border-[#6b7280]/25',
  },
  PENDING_REVIEW: {
    label: 'Em Revisao',
    className: 'bg-[#eab308]/15 text-[#eab308] border-[#eab308]/25',
  },
  CHANGES_REQUESTED: {
    label: 'Mudancas',
    className: 'bg-[#f97316]/15 text-[#f97316] border-[#f97316]/25',
  },
  APPROVED: {
    label: 'Aprovado',
    className: 'bg-[#22c55e]/15 text-[#22c55e] border-[#22c55e]/25',
  },
  SCHEDULED: {
    label: 'Agendado',
    className: 'bg-[#a855f7]/15 text-[#a855f7] border-[#a855f7]/25',
  },
  SUBMITTED: {
    label: 'Submetido',
    className: 'bg-[#8b5cf6]/15 text-[#8b5cf6] border-[#8b5cf6]/25',
  },
  DELIVERED: {
    label: 'Entregue',
    className: 'bg-[#06b6d4]/15 text-[#06b6d4] border-[#06b6d4]/25',
  },
  LIVE: {
    label: 'Live',
    className: 'bg-[#3b82f6]/15 text-[#3b82f6] border-[#3b82f6]/25',
  },
  TAKEDOWN_REQUESTED: {
    label: 'Takedown',
    className: 'bg-[#991b1b]/15 text-[#f87171] border-[#991b1b]/25',
  },
  TAKEN_DOWN: {
    label: 'Removido',
    className: 'bg-[#991b1b]/15 text-[#991b1b] border-[#991b1b]/25',
  },
  REJECTED: {
    label: 'Rejeitado',
    className: 'bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/25',
  },
  ARCHIVED: {
    label: 'Arquivado',
    className: 'bg-[#6b7280]/15 text-[#6b7280] border-[#6b7280]/25',
  },
};

const TYPE_LABELS: Record<string, string> = {
  SINGLE: 'Single',
  EP: 'EP',
  ALBUM: 'Album',
  COMPILATION: 'Compilacao',
  MIXTAPE: 'Mixtape',
  LIVE: 'Live',
  REMIX: 'Remix',
  SOUNDTRACK: 'Trilha Sonora',
};

// ---------------------------------------------------------------------------
// Filter tabs
// ---------------------------------------------------------------------------

interface FilterTab {
  label: string;
  status?: ReleaseStatus;
}

const FILTER_TABS: FilterTab[] = [
  { label: 'Todos' },
  { label: 'Rascunho', status: 'DRAFT' },
  { label: 'Em Revisao', status: 'PENDING_REVIEW' },
  { label: 'Aprovados', status: 'APPROVED' },
  { label: 'Live', status: 'LIVE' },
  { label: 'Arquivados', status: 'ARCHIVED' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return '-';
  }
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['DRAFT'] ?? { label: status, className: 'bg-muted text-muted-foreground border-border' };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
        cfg.className,
      )}
    >
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ReleasesPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 15;

  // Debounce search
  const debounceRef = useMemo(() => ({ timer: null as ReturnType<typeof setTimeout> | null }), []);
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      if (debounceRef.timer) clearTimeout(debounceRef.timer);
      debounceRef.timer = setTimeout(() => {
        setDebouncedSearch(value);
        setPage(1);
      }, 400);
    },
    [debounceRef],
  );

  const params: ReleaseListParams = useMemo(
    () => ({
      page,
      perPage,
      status: FILTER_TABS[activeTab]?.status,
      sort: '-createdAt',
    }),
    [page, activeTab],
  );

  const { data, isLoading, isError } = useReleases(params);

  const releases = data?.data ?? [];
  const meta = data?.meta;

  // Client-side search filter (supplements server-side if search isn't supported in API)
  const filtered = useMemo(() => {
    if (!debouncedSearch) return releases;
    const q = debouncedSearch.toLowerCase();
    return releases.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.artist?.stageName?.toLowerCase().includes(q),
    );
  }, [releases, debouncedSearch]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Releases</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Catalogo de releases e distribuicao
          </p>
        </div>
        <Link href="/releases/new">
          <Button className="gap-2 glow-orange">
            <Plus className="h-4 w-4" />
            Novo Release
          </Button>
        </Link>
      </div>

      {/* Search + Filter tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2.5 flex-1 max-w-sm px-3 py-2 rounded-lg bg-secondary/60 border border-border/30 focus-within:border-primary/30 transition-all">
          <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <input
            type="search"
            placeholder="Buscar releases..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_TABS.map((tab, i) => (
            <button
              key={tab.label}
              onClick={() => {
                setActiveTab(i);
                setPage(1);
              }}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                i === activeTab
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {isLoading ? (
          <TableSkeleton />
        ) : isError ? (
          <div className="p-12 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Erro ao carregar releases. Tente novamente.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState hasSearch={!!debouncedSearch} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[280px]">Titulo</TableHead>
                <TableHead>Artista</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Lancamento</TableHead>
                <TableHead className="text-right">Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((release) => (
                <TableRow
                  key={release.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/releases/${release.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {release.coverAssetId ? (
                        <img
                          src={`/api/assets/${release.coverAssetId}/thumbnail`}
                          alt=""
                          className="w-9 h-9 rounded-md object-cover bg-secondary"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center">
                          <Disc3 className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {release.title}
                        </p>
                        {release.version && (
                          <p className="text-xs text-muted-foreground truncate">
                            {release.version}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {release.artist?.stageName ?? '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] font-medium">
                      {TYPE_LABELS[release.releaseType] ?? release.releaseType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={release.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      {formatDate(release.releaseDate)}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground text-right">
                    {formatDate(release.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Mostrando {(meta.page - 1) * meta.perPage + 1}-
            {Math.min(meta.page * meta.perPage, meta.total)} de {meta.total}{' '}
            releases
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <span className="text-muted-foreground tabular-nums">
              {meta.page} / {meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Proximo
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function TableSkeleton() {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="w-9 h-9 rounded-md" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24 ml-auto" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="p-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
        <Disc3 className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="font-semibold mb-1">
        {hasSearch ? 'Nenhum resultado' : 'Nenhum release ainda'}
      </h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
        {hasSearch
          ? 'Tente ajustar sua busca ou filtros.'
          : 'Crie seu primeiro release para comecar a distribuir musica.'}
      </p>
      {!hasSearch && (
        <Link href="/releases/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Criar Release
          </Button>
        </Link>
      )}
    </div>
  );
}
