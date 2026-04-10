'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Music2, Disc3, Users, BarChart3,
  DollarSign, Ticket, Settings, Zap, FileText, LogOut, ChevronLeft, ChevronRight, Bell,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useState } from 'react';
import { useLogout } from '@/lib/hooks/use-auth';

const mainNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/artists', label: 'Artistas', icon: Music2 },
  { href: '/releases', label: 'Releases', icon: Disc3 },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/royalties', label: 'Royalties', icon: DollarSign },
  { href: '/tickets', label: 'Suporte', icon: Ticket },
  { href: '/notifications', label: 'Notificacoes', icon: Bell },
];

const adminNav = [
  { href: '/users', label: 'Usuarios', icon: Users },
  { href: '/audit', label: 'Auditoria', icon: FileText },
  { href: '/integrations', label: 'Integracoes', icon: Zap },
  { href: '/settings', label: 'Config', icon: Settings },
];

function NavItem({ href, label, icon: Icon, active, collapsed }: {
  href: string; label: string; icon: typeof LayoutDashboard; active: boolean; collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg transition-all duration-150 relative',
        collapsed ? 'px-3 py-2.5 justify-center' : 'px-3 py-2.5',
        active
          ? 'bg-primary/10 text-primary'
          : 'text-white/40 hover:text-white/80 hover:bg-white/[0.04]'
      )}
    >
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary" />
      )}
      <Icon className="w-[18px] h-[18px] flex-shrink-0" />
      {!collapsed && (
        <span className={cn('text-[13px]', active ? 'font-medium' : 'font-normal')}>{label}</span>
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const logout = useLogout();

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col sidebar-gradient border-r border-white/[0.06] transition-all duration-300 relative',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/[0.06]">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 glow-orange">
          <Disc3 className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-semibold tracking-tight text-white">
              Vibe<span className="text-primary">Distro</span>
            </span>
            <span className="text-[9px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-primary/15 text-primary">
              sandbox
            </span>
          </div>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {!collapsed && (
          <div className="px-3 mb-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/25">
              Menu
            </span>
          </div>
        )}
        {mainNav.map((item) => (
          <NavItem key={item.href} {...item} active={isActive(item.href)} collapsed={collapsed} />
        ))}

        {/* Admin divider */}
        <div className="pt-4 mt-4 border-t border-white/[0.06]">
          {!collapsed && (
            <div className="px-3 mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/25">
                Admin
              </span>
            </div>
          )}
        </div>
        {adminNav.map((item) => (
          <NavItem key={item.href} {...item} active={isActive(item.href)} collapsed={collapsed} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-white/[0.06]">
        <button
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className={cn(
            'flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-white/30 hover:text-red-400 hover:bg-red-500/[0.06] transition-all duration-150',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && <span className="text-[13px]">{logout.isPending ? 'Saindo...' : 'Sair'}</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-[#111] border border-white/10 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 shadow-md z-10 text-white/40"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
