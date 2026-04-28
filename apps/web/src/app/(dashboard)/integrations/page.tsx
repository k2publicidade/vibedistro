'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  AlertTriangle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Activity,
  Database,
  Webhook,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  useIntegrationStatus,
  useIntegrationHealth,
  useSyncHistory,
  useFailedWebhooks,
  useExternalMappings,
  useTriggerSync,
  useRetryWebhook,
  useCreateRevelatorAuthorizeUrl,
} from '@/lib/hooks/use-integrations';

// ---- Helpers ----

const SYNC_STATUS: Record<
  string,
  { label: string; className: string }
> = {
  completed: {
    label: 'Concluido',
    className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  },
  running: {
    label: 'Em progresso',
    className: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  },
  failed: {
    label: 'Falhou',
    className: 'bg-red-500/10 text-red-500 border-red-500/20',
  },
  pending: {
    label: 'Pendente',
    className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  },
};

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

// ---- Page ----

export default function IntegrationsPage() {
  const [webhookPage, setWebhookPage] = useState(1);
  const [mappingPage, setMappingPage] = useState(1);

  const status = useIntegrationStatus();
  const health = useIntegrationHealth();
  const syncHistory = useSyncHistory();
  const failedWebhooks = useFailedWebhooks({ page: webhookPage, perPage: 10 });
  const mappings = useExternalMappings({ page: mappingPage, perPage: 10 });
  const triggerSync = useTriggerSync();
  const retryWebhook = useRetryWebhook();
  const createAuthorizeUrl = useCreateRevelatorAuthorizeUrl();

  const statusData = status.data;
  const healthData = health.data;
  const syncData = syncHistory.data?.data ?? [];
  const webhooksData = failedWebhooks.data?.data ?? [];
  const webhooksMeta = failedWebhooks.data?.meta;
  const mappingsData = mappings.data?.data ?? [];
  const mappingsMeta = mappings.data?.meta;

  const isConnected = statusData?.connected ?? false;

  async function handleOpenRevelator() {
    try {
      const result = await createAuthorizeUrl.mutateAsync({});
      window.location.href = result.url;
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Erro ao abrir Revelator',
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integracoes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie conexoes com a Revelator e sincronizacao de dados
        </p>
      </div>

      {/* Connection Status Card */}
      <div className="card-elevated rounded-xl p-6">
        {status.isLoading ? (
          <div className="flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center',
                  isConnected ? 'bg-emerald-500/10' : 'bg-red-500/10',
                )}
              >
                {isConnected ? (
                  <CheckCircle className="h-6 w-6 text-emerald-500" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Revelator API</h3>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px]',
                      isConnected
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : 'bg-red-500/10 text-red-500 border-red-500/20',
                    )}
                  >
                    {isConnected ? 'Conectado' : 'Desconectado'}
                  </Badge>
                  {statusData?.environment && (
                    <Badge variant="outline" className="text-[10px]">
                      {statusData.environment}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                  {healthData && (
                    <span className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      Latencia: {healthData.latency}ms
                    </span>
                  )}
                  {statusData?.lastSync && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Ultimo sync: {formatDateTime(statusData.lastSync)}
                    </span>
                  )}
                  {statusData?.pendingJobs != null && statusData.pendingJobs > 0 && (
                    <span className="flex items-center gap-1 text-yellow-500">
                      <AlertTriangle className="h-3 w-3" />
                      {statusData.pendingJobs} jobs pendentes
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                disabled={!isConnected || createAuthorizeUrl.isPending}
                onClick={handleOpenRevelator}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Abrir Revelator
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                disabled={triggerSync.isPending}
                onClick={() => triggerSync.mutate('full')}
              >
                <RefreshCw
                  className={cn('h-3.5 w-3.5', triggerSync.isPending && 'animate-spin')}
                />
                Sync Completo
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Sync Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {['artists', 'releases', 'royalties'].map((type) => {
          const last = syncData.find((s) => s.type === type);
          const fallback = { label: 'Pendente', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' };
          const cfg = last
            ? (SYNC_STATUS[last.status] ?? fallback)
            : fallback;

          return (
            <div key={type} className="card-elevated rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium capitalize">{type}</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 text-xs"
                  disabled={triggerSync.isPending}
                  onClick={() => triggerSync.mutate(type)}
                >
                  <RefreshCw
                    className={cn('h-3 w-3', triggerSync.isPending && 'animate-spin')}
                  />
                  Sync
                </Button>
              </div>
              {!last ? (
                <p className="text-xs text-muted-foreground">Nenhum sync registrado</p>
              ) : (
                <div className="space-y-1.5">
                  <Badge variant="outline" className={cn('text-[10px]', cfg.className)}>
                    {cfg.label}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {last.entitiesProcessed} entidades • {last.errors} erros
                  </p>
                  <p className="text-[10px] text-muted-foreground/60">
                    {formatDateTime(last.completedAt ?? last.startedAt)}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="history" className="gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Historico Sync
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-1.5">
            <Webhook className="h-3.5 w-3.5" />
            Webhooks Falhos
            {webhooksMeta?.total != null && webhooksMeta.total > 0 && (
              <span className="ml-1 text-xs text-red-400">
                ({webhooksMeta.total})
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="mappings" className="gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" />
            Mapeamentos
          </TabsTrigger>
        </TabsList>

        {/* Sync History */}
        <TabsContent value="history">
          <div className="card-elevated rounded-xl">
            {syncHistory.isLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : syncData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Clock className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum sync registrado</p>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-muted-foreground p-4">
                        Tipo
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-4">
                        Status
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-4 hidden sm:table-cell">
                        Entidades
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-4 hidden sm:table-cell">
                        Erros
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-4 hidden md:table-cell">
                        Inicio
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-4 hidden md:table-cell">
                        Fim
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {syncData.map((record) => {
                      const cfg =
                        SYNC_STATUS[record.status] ?? SYNC_STATUS['pending'] ?? { label: 'Pendente', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' };
                      return (
                        <tr
                          key={record.id}
                          className="border-b border-border/50 last:border-0 hover:bg-secondary/50 transition-colors"
                        >
                          <td className="p-4 font-medium capitalize">
                            {record.type}
                          </td>
                          <td className="p-4">
                            <Badge
                              variant="outline"
                              className={cn('text-[10px]', cfg.className)}
                            >
                              {cfg.label}
                            </Badge>
                          </td>
                          <td className="p-4 hidden sm:table-cell text-muted-foreground">
                            {record.entitiesProcessed}
                          </td>
                          <td className="p-4 hidden sm:table-cell">
                            <span
                              className={
                                record.errors > 0
                                  ? 'text-red-400'
                                  : 'text-muted-foreground'
                              }
                            >
                              {record.errors}
                            </span>
                          </td>
                          <td className="p-4 hidden md:table-cell text-xs text-muted-foreground">
                            {formatDateTime(record.startedAt)}
                          </td>
                          <td className="p-4 hidden md:table-cell text-xs text-muted-foreground">
                            {formatDateTime(record.completedAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Failed Webhooks */}
        <TabsContent value="webhooks">
          <div className="card-elevated rounded-xl">
            {failedWebhooks.isLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : webhooksData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <CheckCircle className="h-8 w-8 text-emerald-500 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhum webhook com falha
                </p>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-muted-foreground p-4">
                        Evento
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-4 hidden sm:table-cell">
                        Tentativas
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-4 hidden md:table-cell">
                        Erro
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-4 hidden md:table-cell">
                        Data
                      </th>
                      <th className="text-right text-xs font-medium text-muted-foreground p-4">
                        Acoes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {webhooksData.map((wh) => (
                      <tr
                        key={wh.id}
                        className="border-b border-border/50 last:border-0 hover:bg-secondary/50 transition-colors"
                      >
                        <td className="p-4 font-medium text-sm">
                          {wh.eventType}
                        </td>
                        <td className="p-4 hidden sm:table-cell text-muted-foreground">
                          {wh.attempts}/{wh.maxAttempts}
                        </td>
                        <td className="p-4 hidden md:table-cell text-xs text-red-400 truncate max-w-[200px]">
                          {wh.failureReason ?? '—'}
                        </td>
                        <td className="p-4 hidden md:table-cell text-xs text-muted-foreground">
                          {formatDateTime(wh.createdAt)}
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 text-xs"
                            onClick={() => retryWebhook.mutate(wh.id)}
                            disabled={retryWebhook.isPending}
                          >
                            <RefreshCw className="h-3 w-3" />
                            Retry
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {webhooksMeta && webhooksMeta.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Pagina {webhooksMeta.page} de {webhooksMeta.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={webhookPage <= 1}
                    onClick={() => setWebhookPage((p) => Math.max(1, p - 1))}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={webhookPage >= webhooksMeta.totalPages}
                    onClick={() => setWebhookPage((p) => p + 1)}
                    className="gap-1"
                  >
                    Proximo
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Mappings */}
        <TabsContent value="mappings">
          <div className="card-elevated rounded-xl">
            {mappings.isLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : mappingsData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <ExternalLink className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhum mapeamento externo
                </p>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-muted-foreground p-4">
                        Entidade
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-4">
                        ID Externo
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-4 hidden sm:table-cell">
                        Status Sync
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-4 hidden md:table-cell">
                        Ultimo Sync
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappingsData.map((m) => (
                      <tr
                        key={m.id}
                        className="border-b border-border/50 last:border-0 hover:bg-secondary/50 transition-colors"
                      >
                        <td className="p-4 font-medium">{m.entityType}</td>
                        <td className="p-4 font-mono text-xs text-muted-foreground">
                          {m.externalId}
                        </td>
                        <td className="p-4 hidden sm:table-cell">
                          <Badge variant="outline" className="text-[10px]">
                            {m.syncStatus}
                          </Badge>
                        </td>
                        <td className="p-4 hidden md:table-cell text-xs text-muted-foreground">
                          {formatDateTime(m.lastSyncedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {mappingsMeta && mappingsMeta.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Pagina {mappingsMeta.page} de {mappingsMeta.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={mappingPage <= 1}
                    onClick={() => setMappingPage((p) => Math.max(1, p - 1))}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={mappingPage >= mappingsMeta.totalPages}
                    onClick={() => setMappingPage((p) => p + 1)}
                    className="gap-1"
                  >
                    Proximo
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
