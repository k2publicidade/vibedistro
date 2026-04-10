'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Music2,
  Disc3,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Zap,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAnalyticsOverview } from '@/lib/hooks/use-analytics';
import { useReleases } from '@/lib/hooks/use-releases';
import { useArtists } from '@/lib/hooks/use-artists';
import { useIntegrationHealth } from '@/lib/hooks/use-integrations';
import { useNotifications } from '@/lib/hooks/use-notifications';
import type { ReleaseStatus, Notification } from '@/lib/types';

// ---- Helpers ----

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('pt-BR');
}

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatDelta(delta: number): string {
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}%`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m atras`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atras`;
  const days = Math.floor(hours / 24);
  return `${days}d atras`;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  LIVE: { label: 'Live', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  PENDING_REVIEW: { label: 'Em Revisao', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  APPROVED: { label: 'Aprovado', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  DRAFT: { label: 'Rascunho', className: 'bg-muted text-muted-foreground border-border' },
  SUBMITTED: { label: 'Enviado', className: 'bg-violet-500/10 text-violet-500 border-violet-500/20' },
  DELIVERED: { label: 'Entregue', className: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
  SCHEDULED: { label: 'Agendado', className: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
  CHANGES_REQUESTED: { label: 'Alteracoes', className: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  REJECTED: { label: 'Rejeitado', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
  TAKEN_DOWN: { label: 'Retirado', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
  TAKEDOWN_REQUESTED: { label: 'Retirando', className: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  ARCHIVED: { label: 'Arquivado', className: 'bg-muted text-muted-foreground border-border' },
};

function getNotificationIcon(type: string) {
  if (type.includes('RELEASE')) return { icon: Disc3, color: 'text-primary' };
  if (type.includes('APPROVAL')) return { icon: CheckCircle2, color: 'text-blue-500' };
  if (type.includes('ROYALTY') || type.includes('PAYOUT')) return { icon: DollarSign, color: 'text-primary' };
  if (type.includes('WEBHOOK') || type.includes('SYNC')) return { icon: AlertCircle, color: 'text-yellow-500' };
  if (type.includes('USER')) return { icon: Music2, color: 'text-emerald-500' };
  if (type.includes('TICKET')) return { icon: Play, color: 'text-blue-500' };
  return { icon: AlertCircle, color: 'text-muted-foreground' };
}

// ---- Skeleton Components ----

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

function ReleaseSkeleton() {
  return (
    <div className="flex items-center gap-4 px-3 py-2.5">
      <Skeleton className="w-9 h-9 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  );
}

// ---- Page ----

export default function DashboardPage() {
  const overview = useAnalyticsOverview('30d');
  const releases = useReleases({ page: 1, perPage: 5, sort: 'updatedAt:desc' });
  const artists = useArtists({ page: 1, perPage: 1 });
  const health = useIntegrationHealth();
  const notifications = useNotifications({ page: 1, perPage: 5 });

  const overviewData = overview.data;
  const releasesData = releases.data?.data ?? [];
  const artistCount = artists.data?.meta?.total ?? 0;
  const notificationsData = notifications.data?.data ?? [];

  const kpis = useMemo(() => {
    if (!overviewData) return null;
    return [
      {
        label: 'Artistas',
        value: overviewData.totalArtists > 0 ? String(overviewData.totalArtists) : String(artistCount),
        icon: Music2,
        delta: overviewData.deltas.artists,
        color: 'text-primary',
      },
      {
        label: 'Releases Ativos',
        value: String(overviewData.totalReleases),
        icon: Disc3,
        delta: overviewData.deltas.releases,
        color: 'text-emerald-500',
      },
      {
        label: 'Streams (30d)',
        value: formatNumber(overviewData.totalStreams),
        icon: TrendingUp,
        delta: overviewData.deltas.streams,
        color: 'text-blue-500',
      },
      {
        label: 'Receita (30d)',
        value: formatCurrency(overviewData.totalRevenue),
        icon: DollarSign,
        delta: overviewData.deltas.revenue,
        color: 'text-primary',
      },
    ];
  }, [overviewData, artistCount]);

  const healthStatus = health.data;
  const isConnected = healthStatus?.status === 'ok' || healthStatus?.status === 'healthy';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visao geral da sua distribuidora
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/analytics">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <TrendingUp className="h-3.5 w-3.5" />
              Ver Analytics
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {overview.isLoading
          ? Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
          : kpis?.map(({ label, value, icon: Icon, delta, color }) => {
              const isUp = delta >= 0;
              return (
                <div key={label} className="card-interactive rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-secondary">
                      <Icon className={cn('h-4 w-4', color)} />
                    </div>
                    <div
                      className={cn(
                        'flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-md',
                        isUp ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10',
                      )}
                    >
                      {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {formatDelta(delta)}
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold tracking-tight">{value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Recent Releases - 3 columns */}
        <div className="lg:col-span-3 card-elevated rounded-xl">
          <div className="flex items-center justify-between p-5 pb-0">
            <div>
              <h2 className="font-semibold">Releases Recentes</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Ultimas atualizacoes</p>
            </div>
            <Link href="/releases">
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground">
                Ver todos
                <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>
          </div>

          <div className="p-5 pt-4">
            {releases.isLoading ? (
              <div className="space-y-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <ReleaseSkeleton key={i} />
                ))}
              </div>
            ) : releasesData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Disc3 className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum release encontrado</p>
                <Link href="/releases">
                  <Button variant="outline" size="sm" className="mt-3">
                    Criar Release
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {releasesData.map((release) => {
                  const status = STATUS_CONFIG[release.status] ?? STATUS_CONFIG['DRAFT'] ?? { label: 'Draft', className: 'bg-muted text-muted-foreground border-border' };
                  return (
                    <Link
                      key={release.id}
                      href={`/releases/${release.id}`}
                      className="flex items-center gap-4 px-3 py-2.5 rounded-lg hover:bg-secondary/50 transition-colors group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                        <Disc3 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{release.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {release.artist?.stageName ?? '—'} &middot; {release.releaseType}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                          status.className,
                        )}
                      >
                        {status.label}
                      </span>
                      <span className="text-xs text-muted-foreground hidden sm:block w-14 text-right">
                        {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(
                          new Date(release.updatedAt),
                        )}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Activity - 2 columns */}
        <div className="lg:col-span-2 card-elevated rounded-xl">
          <div className="flex items-center justify-between p-5 pb-0">
            <div>
              <h2 className="font-semibold">Atividade</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Notificacoes recentes</p>
            </div>
          </div>

          <div className="p-5 pt-4">
            {notifications.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-3 px-2 py-2.5">
                    <Skeleton className="h-4 w-4 mt-0.5 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notificationsData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma notificacao recente</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notificationsData.map((notification) => {
                  const { icon: NIcon, color } = getNotificationIcon(notification.type);
                  return (
                    <div
                      key={notification.id}
                      className="flex gap-3 px-2 py-2.5 rounded-lg hover:bg-secondary/50 transition-colors"
                    >
                      <div className={cn('mt-0.5 flex-shrink-0', color)}>
                        <NIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-snug">{notification.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {timeAgo(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Revelator Status */}
      <div className="card-elevated rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {health.isLoading ? (
              <Skeleton className="w-2 h-2 rounded-full" />
            ) : (
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500',
                )}
              />
            )}
            <span className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-primary" />
              Revelator API
            </span>
            <span className="text-xs text-muted-foreground">Sandbox</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Enterprise ID: 893945</span>
            {healthStatus?.latency != null && (
              <span>Latencia: ~{healthStatus.latency}ms</span>
            )}
            <span
              className={cn(
                'font-medium',
                isConnected ? 'text-emerald-500' : 'text-red-500',
              )}
            >
              {health.isLoading ? '...' : isConnected ? 'Conectado' : 'Desconectado'}
            </span>
            <Link href="/integrations">
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                Detalhes
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
