'use client';

import { useState } from 'react';
import {
  Bell,
  BellOff,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Disc3,
  DollarSign,
  AlertTriangle,
  UserPlus,
  Ticket,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
} from '@/lib/hooks/use-notifications';
import type { NotificationType } from '@/lib/types';

// ---- Helpers ----

const NOTIFICATION_ICONS: Partial<Record<NotificationType, typeof Bell>> = {
  RELEASE_STATUS_CHANGED: Disc3,
  TRACK_STATUS_CHANGED: Disc3,
  APPROVAL_REQUESTED: AlertTriangle,
  APPROVAL_DECISION: CheckCheck,
  ROYALTY_STATEMENT_AVAILABLE: DollarSign,
  PAYOUT_STATUS_CHANGED: DollarSign,
  WEBHOOK_FAILED: Zap,
  SYNC_FAILED: Zap,
  USER_INVITED: UserPlus,
  USER_JOINED: UserPlus,
  TICKET_UPDATED: Ticket,
  SYSTEM_ALERT: AlertTriangle,
};

const NOTIFICATION_COLORS: Partial<Record<NotificationType, string>> = {
  RELEASE_STATUS_CHANGED: 'text-blue-400',
  TRACK_STATUS_CHANGED: 'text-blue-400',
  APPROVAL_REQUESTED: 'text-yellow-500',
  APPROVAL_DECISION: 'text-emerald-500',
  ROYALTY_STATEMENT_AVAILABLE: 'text-emerald-500',
  PAYOUT_STATUS_CHANGED: 'text-emerald-500',
  WEBHOOK_FAILED: 'text-red-400',
  SYNC_FAILED: 'text-red-400',
  USER_INVITED: 'text-purple-400',
  USER_JOINED: 'text-purple-400',
  TICKET_UPDATED: 'text-blue-400',
  SYSTEM_ALERT: 'text-yellow-500',
};

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

// ---- Page ----

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const params = {
    page,
    perPage: 20,
    ...(filter === 'unread' && { read: false }),
  };

  const notifications = useNotifications(params);
  const unreadCount = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const data = notifications.data?.data ?? [];
  const meta = notifications.data?.meta;
  const unread = unreadCount.data?.count ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notificacoes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unread > 0
              ? `${unread} notificacao${unread > 1 ? 'es' : ''} nao lida${unread > 1 ? 's' : ''}`
              : 'Todas as notificacoes lidas'}
          </p>
        </div>
        {unread > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
          >
            <CheckCheck className="h-4 w-4" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <Tabs value={filter} onValueChange={(v) => { setFilter(v as 'all' | 'unread'); setPage(1); }} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" className="gap-1.5">
            <Bell className="h-3.5 w-3.5" />
            Todas
            {meta?.total != null && (
              <span className="ml-1 text-xs text-muted-foreground">({meta.total})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread" className="gap-1.5">
            <BellOff className="h-3.5 w-3.5" />
            Nao lidas
            {unread > 0 && (
              <span className="ml-1 text-xs text-primary">({unread})</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter}>
          <div className="card-elevated rounded-xl">
            {notifications.isLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-64" />
                    </div>
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
              </div>
            ) : data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Bell className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {filter === 'unread'
                    ? 'Nenhuma notificacao nao lida'
                    : 'Nenhuma notificacao'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {data.map((notif) => {
                  const Icon = NOTIFICATION_ICONS[notif.type] ?? Bell;
                  const iconColor = NOTIFICATION_COLORS[notif.type] ?? 'text-muted-foreground';
                  const isRead = !!notif.readAt;

                  return (
                    <button
                      key={notif.id}
                      onClick={() => {
                        if (!isRead) markAsRead.mutate(notif.id);
                      }}
                      className={cn(
                        'flex items-start gap-3 p-4 w-full text-left transition-colors',
                        isRead
                          ? 'hover:bg-secondary/20 opacity-60'
                          : 'hover:bg-secondary/30 bg-primary/[0.02]',
                      )}
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                          isRead ? 'bg-secondary/50' : 'bg-primary/10',
                        )}
                      >
                        <Icon className={cn('h-4 w-4', isRead ? 'text-muted-foreground' : iconColor)} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'text-sm truncate',
                              isRead ? 'font-normal' : 'font-medium',
                            )}
                          >
                            {notif.title}
                          </span>
                          {!isRead && (
                            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notif.body}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground flex-shrink-0">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(notif.createdAt)}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Pagina {meta.page} de {meta.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="gap-1">
                    <ChevronLeft className="h-4 w-4" /> Anterior
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)} className="gap-1">
                    Proximo <ChevronRight className="h-4 w-4" />
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
