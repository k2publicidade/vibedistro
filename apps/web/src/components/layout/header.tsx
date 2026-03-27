'use client';

import { Bell, Search } from 'lucide-react';

export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <input
          type="search"
          placeholder="Buscar artistas, releases..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex items-center gap-2">
        <button className="relative rounded-md p-2 hover:bg-accent">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
        </button>

        <div className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-accent cursor-pointer">
          <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-xs text-primary-foreground font-bold">
            U
          </div>
          <span className="text-sm font-medium hidden sm:block">Usuário</span>
        </div>
      </div>
    </header>
  );
}
