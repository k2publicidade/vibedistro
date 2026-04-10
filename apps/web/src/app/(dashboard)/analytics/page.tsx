'use client';

import { useState, useCallback } from 'react';
import {
  TrendingUp,
  DollarSign,
  Music2,
  Disc3,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { cn } from '@/lib/cn';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useAnalyticsOverview,
  useAnalyticsStreams,
  useAnalyticsPlatforms,
  useTopReleases,
  useTopTracks,
  useSyncAnalytics,
} from '@/lib/hooks/use-analytics';

// ---- Helpers ----

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('pt-BR');
}

function formatCurrency(cents: number): string {
  const value = cents / 100;
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatDelta(delta: number): string {
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}%`;
}

const PLATFORM_COLORS: Record<string, string> = {
  Spotify: '#1DB954',
  'Apple Music': '#FA233B',
  Deezer: '#00C7F2',
  'YouTube Music': '#FF0000',
  Tidal: '#000000',
  Amazon: '#FF9900',
  Other: '#6b7280',
};

function getPlatformColor(platform: string): string {
  return PLATFORM_COLORS[platform] ?? PLATFORM_COLORS['Other'] ?? '#6b7280';
}

const PERIOD_OPTIONS = [
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
  { value: '1y', label: '1 ano' },
];

// ---- Custom Tooltip ----

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-semibold text-foreground">
          {formatNumber(entry.value)} streams
        </p>
      ))}
    </div>
  );
}

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { platform: string; streams: number; percentage: number } }>;
}) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  if (!entry) return null;
  const d = entry.payload;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold text-foreground">{d.platform}</p>
      <p className="text-xs text-muted-foreground">
        {formatNumber(d.streams)} streams ({d.percentage.toFixed(1)}%)
      </p>
    </div>
  );
}

// ---- Skeleton Cards ----

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

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30d');
  const [artistFilter, setArtistFilter] = useState<string>('all');

  const overview = useAnalyticsOverview(period);
  const streams = useAnalyticsStreams({ period, artistId: artistFilter !== 'all' ? artistFilter : undefined });
  const platforms = useAnalyticsPlatforms(period);
  const topReleases = useTopReleases({ period, limit: 10 });
  const topTracks = useTopTracks({ period, limit: 10 });
  const syncMutation = useSyncAnalytics();

  const handleSync = useCallback(() => {
    syncMutation.mutate();
  }, [syncMutation]);

  const overviewData = overview.data;

  const kpis = overviewData
    ? [
        {
          label: 'Total Streams',
          value: formatNumber(overviewData.totalStreams),
          delta: overviewData.deltas.streams,
          icon: TrendingUp,
          color: 'text-blue-500',
        },
        {
          label: 'Receita Total',
          value: formatCurrency(overviewData.totalRevenue),
          delta: overviewData.deltas.revenue,
          icon: DollarSign,
          color: 'text-primary',
        },
        {
          label: 'Artistas Ativos',
          value: String(overviewData.totalArtists),
          delta: overviewData.deltas.artists,
          icon: Music2,
          color: 'text-emerald-500',
        },
        {
          label: 'Releases Live',
          value: String(overviewData.totalReleases),
          delta: overviewData.deltas.releases,
          icon: Disc3,
          color: 'text-primary',
        },
      ]
    : null;

  const streamData = streams.data?.data ?? [];
  const platformData = platforms.data?.data ?? [];
  const topReleasesData = topReleases.data?.data ?? [];
  const topTracksData = topTracks.data?.data ?? [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Metricas de desempenho e distribuicao
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[130px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={artistFilter} onValueChange={setArtistFilter}>
            <SelectTrigger className="w-[160px] h-9 text-sm">
              <SelectValue placeholder="Todos artistas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos artistas</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncMutation.isPending}
            className="gap-1.5"
          >
            <RefreshCw
              className={cn('h-3.5 w-3.5', syncMutation.isPending && 'animate-spin')}
            />
            Sincronizar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {overview.isLoading
          ? Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
          : kpis?.map(({ label, value, delta, icon: Icon, color }) => {
              const isUp = delta >= 0;
              return (
                <div key={label} className="card-interactive rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center',
                        'bg-secondary',
                      )}
                    >
                      <Icon className={cn('h-4 w-4', color)} />
                    </div>
                    <div
                      className={cn(
                        'flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-md',
                        isUp
                          ? 'text-emerald-500 bg-emerald-500/10'
                          : 'text-red-500 bg-red-500/10',
                      )}
                    >
                      {isUp ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
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

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Streams over time */}
        <div className="card-elevated rounded-xl">
          <div className="p-5 pb-0">
            <h2 className="font-semibold">Streams ao longo do tempo</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Volume diario de reproducoes
            </p>
          </div>
          <div className="p-5 pt-4">
            {streams.isLoading ? (
              <Skeleton className="h-[280px] w-full rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={streamData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => formatNumber(v)}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="streams"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#f97316', stroke: 'hsl(var(--background))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Platforms Donut */}
        <div className="card-elevated rounded-xl">
          <div className="p-5 pb-0">
            <h2 className="font-semibold">Plataformas</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Distribuicao por DSP
            </p>
          </div>
          <div className="p-5 pt-4">
            {platforms.isLoading ? (
              <Skeleton className="h-[280px] w-full rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={platformData}
                    dataKey="streams"
                    nameKey="platform"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  >
                    {platformData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getPlatformColor(entry.platform)}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => (
                      <span className="text-xs text-muted-foreground">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Releases */}
        <div className="card-elevated rounded-xl">
          <div className="p-5 pb-0">
            <h2 className="font-semibold">Top Releases</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Releases com mais reproducoes
            </p>
          </div>
          <div className="p-5 pt-4">
            {topReleases.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-muted-foreground pb-2 w-8">#</th>
                      <th className="text-left text-xs font-medium text-muted-foreground pb-2">Titulo</th>
                      <th className="text-left text-xs font-medium text-muted-foreground pb-2 hidden sm:table-cell">Artista</th>
                      <th className="text-right text-xs font-medium text-muted-foreground pb-2">Streams</th>
                      <th className="text-right text-xs font-medium text-muted-foreground pb-2 w-16">Delta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topReleasesData.map((item, i) => (
                      <tr
                        key={item.release.id}
                        className="border-b border-border/50 last:border-0 hover:bg-secondary/50 transition-colors"
                      >
                        <td className="py-2 text-muted-foreground font-medium">{i + 1}</td>
                        <td className="py-2 font-medium truncate max-w-[180px]">
                          {item.release.title}
                        </td>
                        <td className="py-2 text-muted-foreground hidden sm:table-cell truncate max-w-[120px]">
                          {item.release.artist?.stageName ?? '—'}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {formatNumber(item.streams)}
                        </td>
                        <td
                          className={cn(
                            'py-2 text-right text-xs font-medium tabular-nums',
                            item.delta >= 0 ? 'text-emerald-500' : 'text-red-500',
                          )}
                        >
                          {formatDelta(item.delta)}
                        </td>
                      </tr>
                    ))}
                    {topReleasesData.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                          Nenhum dado disponivel
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Top Tracks */}
        <div className="card-elevated rounded-xl">
          <div className="p-5 pb-0">
            <h2 className="font-semibold">Top Tracks</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Faixas com mais reproducoes
            </p>
          </div>
          <div className="p-5 pt-4">
            {topTracks.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-muted-foreground pb-2 w-8">#</th>
                      <th className="text-left text-xs font-medium text-muted-foreground pb-2">Titulo</th>
                      <th className="text-left text-xs font-medium text-muted-foreground pb-2 hidden sm:table-cell">ISRC</th>
                      <th className="text-right text-xs font-medium text-muted-foreground pb-2">Streams</th>
                      <th className="text-right text-xs font-medium text-muted-foreground pb-2 w-16">Delta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topTracksData.map((item, i) => (
                      <tr
                        key={item.track.id}
                        className="border-b border-border/50 last:border-0 hover:bg-secondary/50 transition-colors"
                      >
                        <td className="py-2 text-muted-foreground font-medium">{i + 1}</td>
                        <td className="py-2 font-medium truncate max-w-[180px]">
                          {item.track.title}
                        </td>
                        <td className="py-2 text-muted-foreground text-xs font-mono hidden sm:table-cell">
                          {item.track.isrc ?? '—'}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {formatNumber(item.streams)}
                        </td>
                        <td
                          className={cn(
                            'py-2 text-right text-xs font-medium tabular-nums',
                            item.delta >= 0 ? 'text-emerald-500' : 'text-red-500',
                          )}
                        >
                          {formatDelta(item.delta)}
                        </td>
                      </tr>
                    ))}
                    {topTracksData.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                          Nenhum dado disponivel
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
