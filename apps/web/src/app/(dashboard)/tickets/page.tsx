'use client';

import { useState, useCallback } from 'react';
import {
  Ticket,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  MessageSquare,
  AlertCircle,
  Send,
  X,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  useTickets,
  useTicket,
  useCreateTicket,
  useUpdateTicket,
  useAddTicketMessage,
} from '@/lib/hooks/use-tickets';
import type { TicketStatus, TicketPriority } from '@/lib/types';

// ---- Helpers ----

const STATUS_BADGES_MAP: Record<string, { label: string; className: string }> = {
  OPEN: { label: 'Aberto', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  IN_PROGRESS: { label: 'Em Andamento', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  WAITING_ON_CUSTOMER: { label: 'Aguardando', className: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  RESOLVED: { label: 'Resolvido', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  CLOSED: { label: 'Fechado', className: 'bg-muted text-muted-foreground border-border' },
  CANCELLED: { label: 'Cancelado', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
};

const PRIORITY_BADGES_MAP: Record<string, { label: string; className: string }> = {
  LOW: { label: 'Baixa', className: 'bg-muted text-muted-foreground border-border' },
  MEDIUM: { label: 'Media', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  HIGH: { label: 'Alta', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  URGENT: { label: 'Urgente', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
};

function getStatusBadge(status: string) {
  return STATUS_BADGES_MAP[status] ?? { label: status, className: 'bg-muted text-muted-foreground border-border' };
}

function getPriorityBadge(priority: string) {
  return PRIORITY_BADGES_MAP[priority] ?? { label: priority, className: 'bg-muted text-muted-foreground border-border' };
}

function formatDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Agora';
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

// ---- Page ----

export default function TicketsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Sheet states
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  // Create form
  const [newSubject, setNewSubject] = useState('');
  const [newPriority, setNewPriority] = useState<TicketPriority>('MEDIUM');
  const [newDescription, setNewDescription] = useState('');

  // Message form
  const [messageBody, setMessageBody] = useState('');

  const params = {
    page,
    perPage: 10,
    ...(statusFilter !== 'all' && { status: statusFilter as TicketStatus }),
    ...(priorityFilter !== 'all' && { priority: priorityFilter as TicketPriority }),
  };

  const tickets = useTickets(params);
  const detail = useTicket(detailId ?? '', { enabled: !!detailId });
  const createTicket = useCreateTicket();
  const addMessage = useAddTicketMessage();

  const ticketsData = tickets.data?.data ?? [];
  const meta = tickets.data?.meta;

  const filteredTickets = searchInput
    ? ticketsData.filter((t) =>
        t.subject.toLowerCase().includes(searchInput.toLowerCase()),
      )
    : ticketsData;

  const handleCreate = useCallback(() => {
    if (!newSubject || !newDescription) return;
    createTicket.mutate(
      { subject: newSubject, priority: newPriority, description: newDescription },
      {
        onSuccess: () => {
          setCreateOpen(false);
          setNewSubject('');
          setNewPriority('MEDIUM');
          setNewDescription('');
        },
      },
    );
  }, [newSubject, newPriority, newDescription, createTicket]);

  const handleSendMessage = useCallback(() => {
    if (!messageBody || !detailId) return;
    addMessage.mutate(
      { ticketId: detailId, body: messageBody },
      { onSuccess: () => setMessageBody('') },
    );
  }, [messageBody, detailId, addMessage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suporte</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie tickets e solicitacoes de suporte
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2 glow-orange">
          <Plus className="h-4 w-4" />
          Novo Ticket
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2.5 flex-1 w-full sm:max-w-sm px-3 py-2 rounded-lg bg-secondary/60 border border-border/30 focus-within:border-primary/30 transition-all">
          <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <input
            type="search"
            placeholder="Buscar tickets..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[140px] h-9 text-xs bg-secondary/60 border-border/30">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              {Object.entries(STATUS_BADGES_MAP).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[130px] h-9 text-xs bg-secondary/60 border-border/30">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(PRIORITY_BADGES_MAP).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Ticket List */}
      <div className="card-elevated rounded-xl">
        {tickets.isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Ticket className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {searchInput || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Nenhum ticket encontrado'
                : 'Nenhum ticket criado'}
            </p>
            {!searchInput && statusFilter === 'all' && (
              <Button
                onClick={() => setCreateOpen(true)}
                className="mt-4 gap-2"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                Criar Ticket
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filteredTickets.map((ticket) => {
              const statusCfg = getStatusBadge(ticket.status);
              const priorityCfg = getPriorityBadge(ticket.priority);
              const author = ticket.createdBy
                ? ticket.createdBy.firstName
                  ? `${ticket.createdBy.firstName} ${ticket.createdBy.lastName ?? ''}`
                  : ticket.createdBy.email
                : 'Desconhecido';

              return (
                <button
                  key={ticket.id}
                  onClick={() => setDetailId(ticket.id)}
                  className="flex items-start gap-3 p-4 w-full text-left hover:bg-secondary/30 transition-colors"
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                      ticket.priority === 'URGENT' || ticket.priority === 'HIGH'
                        ? 'bg-red-500/10'
                        : 'bg-secondary',
                    )}
                  >
                    {ticket.priority === 'URGENT' ? (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">
                        {ticket.subject}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={cn('text-[10px]', statusCfg.className)}>
                        {statusCfg.label}
                      </Badge>
                      <Badge variant="outline" className={cn('text-[10px]', priorityCfg.className)}>
                        {priorityCfg.label}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        por {author}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                    <Clock className="h-3 w-3" />
                    {formatRelativeTime(ticket.createdAt)}
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
              {meta.total != null && <span className="ml-1">({meta.total} tickets)</span>}
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

      {/* Create Ticket Sheet */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Novo Ticket</SheetTitle>
            <SheetDescription>
              Descreva seu problema ou solicitacao de suporte.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Assunto</label>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-secondary/60 border border-border/30 focus-within:border-primary/30 transition-all">
                <input
                  type="text"
                  placeholder="Resumo do problema..."
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Prioridade</label>
              <Select value={newPriority} onValueChange={(v) => setNewPriority(v as TicketPriority)}>
                <SelectTrigger className="bg-secondary/60 border-border/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_BADGES_MAP).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descricao</label>
              <textarea
                placeholder="Descreva o problema em detalhes..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 rounded-lg bg-secondary/60 border border-border/30 focus:border-primary/30 transition-all text-sm outline-none placeholder:text-muted-foreground/50 resize-none"
              />
            </div>

            <Button
              onClick={handleCreate}
              disabled={!newSubject || !newDescription || createTicket.isPending}
              className="w-full gap-2"
            >
              <Plus className="h-4 w-4" />
              {createTicket.isPending ? 'Criando...' : 'Criar Ticket'}
            </Button>
            {createTicket.isError && (
              <p className="text-xs text-destructive text-center">
                Erro ao criar ticket. Tente novamente.
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Ticket Detail Sheet */}
      <Sheet open={!!detailId} onOpenChange={(open) => !open && setDetailId(null)}>
        <SheetContent className="sm:max-w-lg flex flex-col">
          <SheetHeader>
            <SheetTitle className="truncate">
              {detail.data?.subject ?? 'Carregando...'}
            </SheetTitle>
            {detail.data && (
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px]',
                    getStatusBadge(detail.data.status).className,
                  )}
                >
                  {getStatusBadge(detail.data.status).label}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px]',
                    getPriorityBadge(detail.data.priority).className,
                  )}
                >
                  {getPriorityBadge(detail.data.priority).label}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {formatDateTime(detail.data.createdAt)}
                </span>
              </div>
            )}
          </SheetHeader>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto mt-4 space-y-3 min-h-0">
            {detail.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : !detail.data?.messages?.length ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MessageSquare className="h-6 w-6 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">Nenhuma mensagem</p>
              </div>
            ) : (
              detail.data.messages.map((msg) => {
                const authorName = msg.author
                  ? msg.author.firstName
                    ? `${msg.author.firstName} ${msg.author.lastName ?? ''}`
                    : msg.author.email
                  : 'Desconhecido';
                const initials = msg.author
                  ? msg.author.firstName
                    ? `${msg.author.firstName[0]}${(msg.author.lastName ?? '')[0] ?? ''}`
                    : msg.author.email.slice(0, 2)
                  : '??';

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      'p-3 rounded-lg',
                      msg.isInternal
                        ? 'bg-yellow-500/5 border border-yellow-500/10'
                        : 'bg-secondary/40 border border-border/20',
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/80 to-orange-600 flex items-center justify-center text-[8px] font-bold text-white">
                        {initials.toUpperCase()}
                      </div>
                      <span className="text-xs font-medium">{authorName}</span>
                      {msg.isInternal && (
                        <Badge variant="outline" className="text-[8px] bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                          Interno
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {formatRelativeTime(msg.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                      {msg.body}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* New message input */}
          <div className="pt-3 border-t border-border/50 mt-auto">
            <div className="flex items-end gap-2">
              <textarea
                placeholder="Escreva uma mensagem..."
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                rows={2}
                className="flex-1 px-3 py-2 rounded-lg bg-secondary/60 border border-border/30 focus:border-primary/30 transition-all text-sm outline-none placeholder:text-muted-foreground/50 resize-none"
              />
              <Button
                size="sm"
                disabled={!messageBody || addMessage.isPending}
                onClick={handleSendMessage}
                className="gap-1"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
