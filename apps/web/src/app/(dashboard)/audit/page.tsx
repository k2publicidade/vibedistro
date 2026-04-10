'use client';

import { useState } from 'react';
import {
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuditLogs, useAuditActions } from '@/lib/hooks/use-audit';

// ---- Helpers ----

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  UPDATE: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  DELETE: 'bg-red-500/10 text-red-500 border-red-500/20',
  LOGIN: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  LOGOUT: 'bg-muted text-muted-foreground border-border',
  SYNC: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  APPROVE: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  REJECT: 'bg-red-500/10 text-red-500 border-red-500/20',
};

function getActionColor(action: string): string {
  const key = Object.keys(ACTION_COLORS).find((k) =>
    action.toUpperCase().includes(k),
  );
  return (key ? ACTION_COLORS[key] : undefined) ?? 'bg-muted text-muted-foreground border-border';
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Agora';
  if (mins < 60) return `${mins}min atras`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atras`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d atras`;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

const ENTITY_TYPES = [
  'Release',
  'Track',
  'Artist',
  'User',
  'RoyaltyStatement',
  'Ticket',
  'Integration',
];

// ---- Page ----

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');

  const params = {
    page,
    perPage: 20,
    ...(actionFilter !== 'all' && { action: actionFilter }),
    ...(entityFilter !== 'all' && { entityType: entityFilter }),
  };

  const logs = useAuditLogs(params);
  const actions = useAuditActions();

  const logsData = logs.data?.data ?? [];
  const meta = logs.data?.meta;

  const filteredLogs = searchInput
    ? logsData.filter(
        (l) =>
          l.action.toLowerCase().includes(searchInput.toLowerCase()) ||
          l.resource.toLowerCase().includes(searchInput.toLowerCase()) ||
          l.actor?.email?.toLowerCase().includes(searchInput.toLowerCase()),
      )
    : logsData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Auditoria</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Historico de atividades e alteracoes no sistema
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2.5 flex-1 w-full sm:max-w-sm px-3 py-2 rounded-lg bg-secondary/60 border border-border/30 focus-within:border-primary/30 transition-all">
          <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <input
            type="search"
            placeholder="Buscar por acao, recurso ou usuario..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={actionFilter}
            onValueChange={(v) => {
              setActionFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[140px] h-9 text-xs bg-secondary/60 border-border/30">
              <SelectValue placeholder="Acao" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas acoes</SelectItem>
              {(actions.data ?? []).map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={entityFilter}
            onValueChange={(v) => {
              setEntityFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[140px] h-9 text-xs bg-secondary/60 border-border/30">
              <SelectValue placeholder="Entidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas entidades</SelectItem>
              {ENTITY_TYPES.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Timeline */}
      <div className="card-elevated rounded-xl">
        {logs.isLoading ? (
          <div className="p-5 space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {searchInput || actionFilter !== 'all' || entityFilter !== 'all'
                ? 'Nenhum registro encontrado com esses filtros'
                : 'Nenhum registro de auditoria'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filteredLogs.map((log) => {
              const actorName = log.actor
                ? log.actor.firstName
                  ? `${log.actor.firstName} ${log.actor.lastName ?? ''}`
                  : log.actor.email
                : 'Sistema';
              const actorInitials = log.actor
                ? log.actor.firstName
                  ? `${log.actor.firstName[0]}${(log.actor.lastName ?? '')[0] ?? ''}`
                  : log.actor.email.slice(0, 2)
                : 'SY';

              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-4 hover:bg-secondary/30 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-orange-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5">
                    {actorInitials.toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{actorName}</span>
                      <Badge
                        variant="outline"
                        className={cn('text-[10px]', getActionColor(log.action))}
                      >
                        {log.action}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {log.resource}
                        {log.resourceId && (
                          <span className="text-muted-foreground/60">
                            {' '}
                            #{log.resourceId.slice(0, 8)}
                          </span>
                        )}
                      </span>
                    </div>
                    {(log.before || log.after) && (
                      <div className="mt-1.5 text-xs text-muted-foreground/70 flex items-center gap-1">
                        {log.before && (
                          <span className="bg-red-500/5 px-1.5 py-0.5 rounded text-red-400/70 font-mono truncate max-w-[200px]">
                            {JSON.stringify(log.before).slice(0, 50)}
                          </span>
                        )}
                        {log.before && log.after && (
                          <ArrowRight className="h-3 w-3 flex-shrink-0" />
                        )}
                        {log.after && (
                          <span className="bg-emerald-500/5 px-1.5 py-0.5 rounded text-emerald-400/70 font-mono truncate max-w-[200px]">
                            {JSON.stringify(log.after).slice(0, 50)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                    <Clock className="h-3 w-3" />
                    {formatRelativeTime(log.createdAt)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Pagina {meta.page} de {meta.totalPages}
              {meta.total != null && (
                <span className="ml-1">({meta.total} registros)</span>
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
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="gap-1"
              >
                Proximo
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
