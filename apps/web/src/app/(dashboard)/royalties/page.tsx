'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileText,
  BarChart3,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useRoyaltiesSummary,
  useRoyaltyStatements,
  useRoyaltiesByArtist,
  useRoyaltiesByPlatform,
  useSyncRoyalties,
} from '@/lib/hooks/use-royalties';
import type { RoyaltyStatementStatus } from '@/lib/types';
import { StatementDetailSheet } from './_components/statement-detail-sheet';

// ---- Helpers ----

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDelta(delta: number): string {
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}%`;
}

const PERIOD_OPTIONS = [
  { value: '2026-03', label: 'Marco 2026' },
  { value: '2026-02', label: 'Fevereiro 2026' },
  { value: '2026-01', label: 'Janeiro 2026' },
  { value: '2025-12', label: 'Dezembro 2025' },
];

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'Rascunho', className: 'bg-muted text-muted-foreground' },
  PROCESSING: { label: 'Processando', className: 'bg-yellow-500/10 text-yellow-500' },
  AVAILABLE: { label: 'Disponivel', className: 'bg-emerald-500/10 text-emerald-500' },
  DISPUTED: { label: 'Disputado', className: 'bg-red-500/10 text-red-500' },
  FINAL: { label: 'Finalizado', className: 'bg-blue-500/10 text-blue-500' },
};

const PLATFORM_COLORS: Record<string, string> = {
  Spotify: 'bg-[#1DB954]/10 text-[#1DB954]',
  'Apple Music': 'bg-[#FA233B]/10 text-[#FA233B]',
  Deezer: 'bg-[#00C7F2]/10 text-[#00C7F2]',
  'YouTube Music': 'bg-[#FF0000]/10 text-[#FF0000]',
  Tidal: 'bg-white/10 text-white',
  Amazon: 'bg-[#FF9900]/10 text-[#FF9900]',
};

// ---- Skeleton ----

function KpiSkeleton() {
  return (
    <div className="card-interactive rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-5 w-14 rounded-md" />
      </div>
      <div>
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-3 w-16 mt-2" />
      </div>
    </div>
  );
}

// ---- Page ----

export default function RoyaltiesPage() {
  const [period, setPeriod] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [selectedStatementId, setSelectedStatementId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const summary = useRoyaltiesSummary(period);
  const statements = useRoyaltyStatements({ page, perPage: 10, period });
  const byArtist = useRoyaltiesByArtist(period);
  const byPlatform = useRoyaltiesByPlatform(period);
  const syncMutation = useSyncRoyalties();

  const summaryData = summary.data;
  const statementsData = statements.data?.data ?? [];
  const statementsMeta = statements.data?.meta;
  const artistsData = byArtist.data?.data ?? [];
  const platformsData = byPlatform.data?.data ?? [];

  const handleSync = useCallback(() => {
    syncMutation.mutate();
  }, [syncMutation]);

  const handleOpenStatement = useCallback((id: string) => {
    setSelectedStatementId(id);
    setSheetOpen(true);
  }, []);

  const kpis = useMemo(() => {
    if (!summaryData) return null;
    return [
      {
        label: 'Receita Bruta',
        value: formatCurrency(summaryData.grossRevenue),
        delta: summaryData.deltas.grossRevenue,
        icon: DollarSign,
        color: 'text-primary',
      },
      {
        label: 'Receita Liquida',
        value: formatCurrency(summaryData.netRevenue),
        delta: summaryData.deltas.netRevenue,
        icon: TrendingUp,
        color: 'text-emerald-500',
      },
      {
        label: 'Pendente',
        value: formatCurrency(summaryData.pending),
        delta: 0,
        icon: FileText,
        color: 'text-yellow-500',
      },
      {
        label: 'Pago',
        value: formatCurrency(summaryData.paid),
        delta: 0,
        icon: DollarSign,
        color: 'text-blue-500',
      },
    ];
  }, [summaryData]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Royalties</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Receitas, statements e distribuicao de royalties
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={period ?? 'all'} onValueChange={(v) => setPeriod(v === 'all' ? undefined : v)}>
            <SelectTrigger className="w-[170px] h-9 text-sm">
              <SelectValue placeholder="Todos os periodos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os periodos</SelectItem>
              {PERIOD_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncMutation.isPending}
            className="gap-1.5"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', syncMutation.isPending && 'animate-spin')} />
            Sincronizar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summary.isLoading
          ? Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
          : kpis?.map(({ label, value, delta, icon: Icon, color }) => {
              const isUp = delta >= 0;
              const showDelta = delta !== 0;
              return (
                <div key={label} className="card-interactive rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-secondary">
                      <Icon className={cn('h-4 w-4', color)} />
                    </div>
                    {showDelta && (
                      <div
                        className={cn(
                          'flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-md',
                          isUp ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10',
                        )}
                      >
                        {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {formatDelta(delta)}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-2xl font-bold tracking-tight">{value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="statements" className="space-y-6">
        <TabsList>
          <TabsTrigger value="statements" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Statements
          </TabsTrigger>
          <TabsTrigger value="by-artist" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Por Artista
          </TabsTrigger>
          <TabsTrigger value="by-platform" className="gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            Por Plataforma
          </TabsTrigger>
        </TabsList>

        {/* Statements Tab */}
        <TabsContent value="statements">
          <div className="card-elevated rounded-xl">
            {statements.isLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : statementsData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum statement encontrado</p>
              </div>
            ) : (
              <>
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left text-xs font-medium text-muted-foreground p-4">Periodo</th>
                        <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
                        <th className="text-right text-xs font-medium text-muted-foreground p-4">Receita Total</th>
                        <th className="text-right text-xs font-medium text-muted-foreground p-4">Processado</th>
                        <th className="text-right text-xs font-medium text-muted-foreground p-4">Acoes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statementsData.map((statement) => {
                        const statusCfg = STATUS_BADGES[statement.status] ?? STATUS_BADGES['DRAFT'] ?? { label: statement.status, className: 'bg-muted text-muted-foreground border-border' };
                        return (
                          <tr
                            key={statement.id}
                            className="border-b border-border/50 last:border-0 hover:bg-secondary/50 transition-colors cursor-pointer"
                            onClick={() => handleOpenStatement(statement.id)}
                          >
                            <td className="p-4 font-medium">{statement.period}</td>
                            <td className="p-4">
                              <Badge variant="outline" className={statusCfg.className}>
                                {statusCfg.label}
                              </Badge>
                            </td>
                            <td className="p-4 text-right tabular-nums font-medium">
                              {formatCurrency(statement.totalRevenueCents)}
                            </td>
                            <td className="p-4 text-right text-muted-foreground text-xs">
                              {statement.processedAt
                                ? new Intl.DateTimeFormat('pt-BR').format(new Date(statement.processedAt))
                                : '—'}
                            </td>
                            <td className="p-4 text-right">
                              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                                <Download className="h-3 w-3" />
                                CSV
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {statementsMeta && statementsMeta.totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Pagina {statementsMeta.page} de {statementsMeta.totalPages}
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
                        disabled={page >= statementsMeta.totalPages}
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
          </div>
        </TabsContent>

        {/* By Artist Tab */}
        <TabsContent value="by-artist">
          <div className="card-elevated rounded-xl">
            {byArtist.isLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : artistsData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum dado disponivel</p>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-muted-foreground p-4">#</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-4">Artista</th>
                      <th className="text-right text-xs font-medium text-muted-foreground p-4">Releases</th>
                      <th className="text-right text-xs font-medium text-muted-foreground p-4">Bruto</th>
                      <th className="text-right text-xs font-medium text-muted-foreground p-4">Liquido</th>
                      <th className="text-right text-xs font-medium text-muted-foreground p-4">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {artistsData.map((item, i) => (
                      <tr
                        key={item.artist.id}
                        className="border-b border-border/50 last:border-0 hover:bg-secondary/50 transition-colors"
                      >
                        <td className="p-4 text-muted-foreground font-medium">{i + 1}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {item.artist.avatarUrl ? (
                              <img
                                src={item.artist.avatarUrl}
                                alt={item.artist.stageName}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-orange-600 flex items-center justify-center text-xs font-bold text-white">
                                {item.artist.stageName.charAt(0)}
                              </div>
                            )}
                            <span className="font-medium">{item.artist.stageName}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right tabular-nums text-muted-foreground">
                          {item.releases}
                        </td>
                        <td className="p-4 text-right tabular-nums">
                          {formatCurrency(item.gross)}
                        </td>
                        <td className="p-4 text-right tabular-nums font-medium text-emerald-500">
                          {formatCurrency(item.net)}
                        </td>
                        <td className="p-4 text-right tabular-nums text-muted-foreground">
                          {item.percentage.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* By Platform Tab */}
        <TabsContent value="by-platform">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {byPlatform.isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card-elevated rounded-xl p-5 space-y-3">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                ))
              : platformsData.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                    <BarChart3 className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhum dado disponivel</p>
                  </div>
                ) : (
                  platformsData.map((platform) => {
                    const colorClasses =
                      PLATFORM_COLORS[platform.platform] ?? 'bg-secondary text-muted-foreground';
                    return (
                      <div key={platform.platform} className="card-elevated rounded-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                          <span className={cn('text-sm font-semibold px-2 py-0.5 rounded-md', colorClasses)}>
                            {platform.platform}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {platform.percentage.toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-xl font-bold tracking-tight mb-3">
                          {formatCurrency(platform.total)}
                        </p>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2 transition-all"
                            style={{ width: `${Math.min(platform.percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Statement Detail Sheet */}
      <StatementDetailSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        statementId={selectedStatementId ?? ''}
      />
    </div>
  );
}
