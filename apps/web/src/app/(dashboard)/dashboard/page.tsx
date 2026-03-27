import type { Metadata } from 'next';
import { Music2, Disc3, TrendingUp, DollarSign } from 'lucide-react';

export const metadata: Metadata = { title: 'Dashboard' };

const stats = [
  { label: 'Total de Artistas', value: '—', icon: Music2, change: null },
  { label: 'Releases Ativos', value: '—', icon: Disc3, change: null },
  { label: 'Streams (30d)', value: '—', icon: TrendingUp, change: null },
  { label: 'Receita (30d)', value: '—', icon: DollarSign, change: null },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visão geral da sua distribuidora
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-lg border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-5">
          <h2 className="font-semibold mb-4">Releases Recentes</h2>
          <p className="text-sm text-muted-foreground">Nenhum release encontrado.</p>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <h2 className="font-semibold mb-4">Atividade Recente</h2>
          <p className="text-sm text-muted-foreground">Nenhuma atividade recente.</p>
        </div>
      </div>
    </div>
  );
}
