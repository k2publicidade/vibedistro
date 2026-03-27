'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Music2, Disc3, Users, BarChart3,
  DollarSign, Ticket, Settings, Zap, FileText,
} from 'lucide-react';
import { cn } from '@/lib/cn';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/artists', label: 'Artistas', icon: Music2 },
  { href: '/releases', label: 'Releases', icon: Disc3 },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/royalties', label: 'Royalties', icon: DollarSign },
  { href: '/tickets', label: 'Suporte', icon: Ticket },
  { href: '/users', label: 'Usuários', icon: Users },
  { href: '/audit', label: 'Auditoria', icon: FileText },
  { href: '/integrations', label: 'Integrações', icon: Zap },
  { href: '/settings', label: 'Configurações', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-60 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <span className="text-lg font-bold tracking-tight">VibeDistro</span>
        <span className="ml-2 rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs font-medium text-yellow-600 dark:text-yellow-400">
          sandbox
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
