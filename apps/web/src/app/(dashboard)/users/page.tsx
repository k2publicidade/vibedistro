'use client';

import { useState, useCallback } from 'react';
import {
  Users as UsersIcon,
  Plus,
  Search,
  Mail,
  Shield,
  ChevronLeft,
  ChevronRight,
  Clock,
  MoreHorizontal,
  UserPlus,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  useUsers,
  useInvites,
  useInviteUser,
  useCancelInvite,
  useUpdateUserRole,
} from '@/lib/hooks/use-users';
import type { UserStatus } from '@/lib/types';

// ---- Helpers ----

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Ativo', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  INACTIVE: { label: 'Inativo', className: 'bg-muted text-muted-foreground border-border' },
  SUSPENDED: { label: 'Suspenso', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
  PENDING_VERIFICATION: { label: 'Verificando', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  INVITED: { label: 'Convidado', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
};

function getInitials(firstName: string | null, lastName: string | null, email: string): string {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
  if (firstName) return firstName.slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

function useDebounce(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);
  import('react').then(({ useMemo: _useMemo }) => {});
  // Simple inline debounce
  useState(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  });
  return debounced;
}

// ---- Page ----

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('');

  const users = useUsers({ page, perPage: 10 });
  const invites = useInvites();
  const inviteMutation = useInviteUser();
  const cancelInviteMutation = useCancelInvite();

  const usersData = users.data?.data ?? [];
  const usersMeta = users.data?.meta;
  const invitesData = invites.data ?? [];

  const filteredUsers = searchInput
    ? usersData.filter(
        (u) =>
          u.email.toLowerCase().includes(searchInput.toLowerCase()) ||
          (u.firstName && u.firstName.toLowerCase().includes(searchInput.toLowerCase())) ||
          (u.lastName && u.lastName.toLowerCase().includes(searchInput.toLowerCase())),
      )
    : usersData;

  const handleInvite = useCallback(() => {
    if (!inviteEmail || !inviteRole) return;
    inviteMutation.mutate(
      { email: inviteEmail, roleId: inviteRole },
      {
        onSuccess: () => {
          setInviteOpen(false);
          setInviteEmail('');
          setInviteRole('');
        },
      },
    );
  }, [inviteEmail, inviteRole, inviteMutation]);

  const handleCancelInvite = useCallback(
    (id: string) => {
      cancelInviteMutation.mutate(id);
    },
    [cancelInviteMutation],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie membros da equipe e convites
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)} className="gap-2 glow-orange">
          <UserPlus className="h-4 w-4" />
          Convidar
        </Button>
      </div>

      <Tabs defaultValue="members" className="space-y-6">
        <TabsList>
          <TabsTrigger value="members" className="gap-1.5">
            <UsersIcon className="h-3.5 w-3.5" />
            Membros
            {usersMeta?.total != null && (
              <span className="ml-1 text-xs text-muted-foreground">({usersMeta.total})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="invites" className="gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            Convites
            {invitesData.length > 0 && (
              <span className="ml-1 text-xs text-muted-foreground">({invitesData.length})</span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members">
          {/* Search */}
          <div className="flex items-center gap-2.5 w-full sm:max-w-sm px-3 py-2 rounded-lg bg-secondary/60 border border-border/30 focus-within:border-primary/30 transition-all mb-4">
            <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <input
              type="search"
              placeholder="Buscar usuarios..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
            />
          </div>

          <div className="card-elevated rounded-xl">
            {users.isLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <UsersIcon className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {searchInput ? 'Nenhum usuario encontrado' : 'Nenhum membro na equipe'}
                </p>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-muted-foreground p-4">Usuario</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-4 hidden sm:table-cell">Role</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-4 hidden md:table-cell">Status</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-4 hidden lg:table-cell">Ultimo Login</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-4 hidden lg:table-cell">MFA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => {
                      const statusCfg = STATUS_BADGES[user.status] ?? { label: 'Ativo', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
                      const initials = getInitials(user.firstName, user.lastName, user.email);
                      const roleName = user.roles?.[0]?.role?.name ?? '—';
                      const isOwner = user.roles?.[0]?.isOwner ?? false;
                      return (
                        <tr
                          key={user.id}
                          className="border-b border-border/50 last:border-0 hover:bg-secondary/50 transition-colors"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {user.avatarUrl ? (
                                <img
                                  src={user.avatarUrl}
                                  alt={user.email}
                                  className="w-9 h-9 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/80 to-orange-600 flex items-center justify-center text-xs font-bold text-white">
                                  {initials}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {user.firstName
                                    ? `${user.firstName} ${user.lastName ?? ''}`
                                    : user.email}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 hidden sm:table-cell">
                            <div className="flex items-center gap-1.5">
                              <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-sm">{roleName}</span>
                              {isOwner && (
                                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                                  Owner
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-4 hidden md:table-cell">
                            <Badge variant="outline" className={cn('text-[10px]', statusCfg.className)}>
                              {statusCfg.label}
                            </Badge>
                          </td>
                          <td className="p-4 hidden lg:table-cell text-xs text-muted-foreground">
                            {user.lastLoginAt
                              ? new Intl.DateTimeFormat('pt-BR', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }).format(new Date(user.lastLoginAt))
                              : 'Nunca'}
                          </td>
                          <td className="p-4 hidden lg:table-cell">
                            <span
                              className={cn(
                                'text-xs font-medium',
                                user.mfaEnabled ? 'text-emerald-500' : 'text-muted-foreground',
                              )}
                            >
                              {user.mfaEnabled ? 'Ativado' : 'Desativado'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {usersMeta && usersMeta.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Pagina {usersMeta.page} de {usersMeta.totalPages}
                  {usersMeta.total != null && (
                    <span className="ml-1">({usersMeta.total} usuarios)</span>
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
                    disabled={page >= usersMeta.totalPages}
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
        </TabsContent>

        {/* Invites Tab */}
        <TabsContent value="invites">
          <div className="card-elevated rounded-xl">
            {invites.isLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : invitesData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Mail className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum convite pendente</p>
                <Button onClick={() => setInviteOpen(true)} className="mt-4 gap-2" size="sm">
                  <UserPlus className="h-4 w-4" />
                  Enviar Convite
                </Button>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-muted-foreground p-4">Email</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-4 hidden sm:table-cell">Enviado em</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-4 hidden sm:table-cell">Expira em</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
                      <th className="text-right text-xs font-medium text-muted-foreground p-4">Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitesData.map((invite) => {
                      const isExpired = new Date(invite.expiresAt) < new Date();
                      const isAccepted = !!invite.acceptedAt;
                      return (
                        <tr
                          key={invite.id}
                          className="border-b border-border/50 last:border-0 hover:bg-secondary/50 transition-colors"
                        >
                          <td className="p-4 font-medium">{invite.email}</td>
                          <td className="p-4 text-muted-foreground text-xs hidden sm:table-cell">
                            {new Intl.DateTimeFormat('pt-BR').format(new Date(invite.createdAt))}
                          </td>
                          <td className="p-4 text-muted-foreground text-xs hidden sm:table-cell">
                            {new Intl.DateTimeFormat('pt-BR').format(new Date(invite.expiresAt))}
                          </td>
                          <td className="p-4">
                            {isAccepted ? (
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">
                                Aceito
                              </Badge>
                            ) : isExpired ? (
                              <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 text-[10px]">
                                Expirado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-[10px]">
                                Pendente
                              </Badge>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            {!isAccepted && !isExpired && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
                                onClick={() => handleCancelInvite(invite.id)}
                                disabled={cancelInviteMutation.isPending}
                              >
                                <X className="h-3 w-3" />
                                Cancelar
                              </Button>
                            )}
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
      </Tabs>

      {/* Invite Sheet */}
      <Sheet open={inviteOpen} onOpenChange={setInviteOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Convidar Membro</SheetTitle>
            <SheetDescription>
              Envie um convite por email para um novo membro da equipe.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-secondary/60 border border-border/30 focus-within:border-primary/30 transition-all">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-secondary/60 border border-border/30 focus-within:border-primary/30 transition-all">
                <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="ID do role (ex: admin, editor, viewer)"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
                />
              </div>
            </div>
            <Button
              onClick={handleInvite}
              disabled={!inviteEmail || !inviteRole || inviteMutation.isPending}
              className="w-full gap-2"
            >
              <UserPlus className="h-4 w-4" />
              {inviteMutation.isPending ? 'Enviando...' : 'Enviar Convite'}
            </Button>
            {inviteMutation.isError && (
              <p className="text-xs text-destructive text-center">
                Erro ao enviar convite. Tente novamente.
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
