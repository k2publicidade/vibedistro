'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Search, ChevronDown, Menu, LogOut, Clock, Music2, Disc3, Ticket as TicketIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from '@/lib/hooks/use-notifications';
import { useGlobalSearch } from '@/lib/hooks/use-search';
import { useLogout } from '@/lib/hooks/use-auth';

export function Header() {
  const router = useRouter();
  const [cmdOpen, setCmdOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const unreadCount = useUnreadCount();
  const notifications = useNotifications({ perPage: 5, read: false });
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const search = useGlobalSearch(searchQuery);
  const logout = useLogout();

  const unread = unreadCount.data?.count ?? 0;
  const notifData = notifications.data?.data ?? [];

  // ⌘K / Ctrl+K handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleSearchSelect = useCallback(
    (href: string) => {
      setCmdOpen(false);
      setSearchQuery('');
      router.push(href);
    },
    [router],
  );

  function formatRelativeTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Agora';
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  }

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-xl px-6 sticky top-0 z-30">
        {/* Mobile menu button */}
        <button className="md:hidden p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors">
          <Menu className="h-5 w-5" />
        </button>

        {/* Search — opens command palette */}
        <div className="hidden md:flex items-center gap-2.5 flex-1 max-w-sm">
          <button
            onClick={() => setCmdOpen(true)}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg bg-secondary/60 border border-border/30 hover:border-primary/30 transition-all duration-200 text-left"
          >
            <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="flex-1 text-sm text-muted-foreground/60">
              Buscar artistas, releases...
            </span>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-background/60 border border-border/50 text-[10px] text-muted-foreground font-mono">
              <span className="text-[11px]">&#8984;</span>K
            </kbd>
          </button>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1">
          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="relative rounded-lg p-2 hover:bg-secondary transition-colors group">
                <Bell className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                {unread > 0 && (
                  <span className="absolute right-1 top-1 min-w-[14px] h-[14px] rounded-full bg-primary flex items-center justify-center text-[9px] font-bold text-white ring-2 ring-background">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="text-sm font-semibold">Notificacoes</span>
                {unread > 0 && (
                  <button
                    onClick={() => markAllAsRead.mutate()}
                    className="text-[10px] text-primary hover:underline"
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Bell className="h-5 w-5 text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">Nenhuma notificacao</p>
                  </div>
                ) : (
                  notifData.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        markAsRead.mutate(n.id);
                      }}
                      className="flex items-start gap-2.5 px-4 py-3 w-full text-left hover:bg-secondary/50 transition-colors border-b border-border/30 last:border-0"
                    >
                      <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{n.title}</p>
                        <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                          {n.body}
                        </p>
                      </div>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0 flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {formatRelativeTime(n.createdAt)}
                      </span>
                    </button>
                  ))
                )}
              </div>
              <div className="border-t border-border px-4 py-2.5">
                <button
                  onClick={() => router.push('/notifications')}
                  className="text-xs text-primary hover:underline w-full text-center"
                >
                  Ver todas as notificacoes
                </button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Divider */}
          <div className="w-px h-6 bg-border/50 mx-2" />

          {/* User */}
          <Popover open={userMenuOpen} onOpenChange={setUserMenuOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-secondary transition-colors group">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-[11px] text-white font-bold ring-2 ring-primary/20">
                  A
                </div>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-[13px] font-medium leading-tight">Admin</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    Super Admin
                  </span>
                </div>
                <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48 p-1">
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  logout.mutate();
                }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      {/* Command Palette */}
      <CommandDialog open={cmdOpen} onOpenChange={setCmdOpen}>
        <CommandInput
          placeholder="Buscar artistas, releases, tracks..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>
            {searchQuery.length < 2
              ? 'Digite pelo menos 2 caracteres...'
              : 'Nenhum resultado encontrado.'}
          </CommandEmpty>

          {search.data?.artists && search.data.artists.length > 0 && (
            <CommandGroup heading="Artistas">
              {search.data.artists.map((a) => (
                <CommandItem
                  key={a.id}
                  onSelect={() => handleSearchSelect(`/artists`)}
                  className="gap-2"
                >
                  <Music2 className="h-4 w-4 text-muted-foreground" />
                  <span>{a.stageName}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {search.data?.releases && search.data.releases.length > 0 && (
            <CommandGroup heading="Releases">
              {search.data.releases.map((r) => (
                <CommandItem
                  key={r.id}
                  onSelect={() => handleSearchSelect(`/releases`)}
                  className="gap-2"
                >
                  <Disc3 className="h-4 w-4 text-muted-foreground" />
                  <span>{r.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {search.data?.tracks && search.data.tracks.length > 0 && (
            <CommandGroup heading="Tracks">
              {search.data.tracks.map((t) => (
                <CommandItem
                  key={t.id}
                  onSelect={() => handleSearchSelect(`/releases`)}
                  className="gap-2"
                >
                  <Disc3 className="h-4 w-4 text-muted-foreground" />
                  <span>{t.title}</span>
                  {t.isrc && (
                    <span className="ml-auto text-[10px] text-muted-foreground font-mono">
                      {t.isrc}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {search.data?.tickets && search.data.tickets.length > 0 && (
            <CommandGroup heading="Tickets">
              {search.data.tickets.map((tk) => (
                <CommandItem
                  key={tk.id}
                  onSelect={() => handleSearchSelect(`/tickets`)}
                  className="gap-2"
                >
                  <TicketIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{tk.subject}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
