import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export const metadata: Metadata = { title: 'Releases' };

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-zinc-500/20 text-zinc-400',
  PENDING_REVIEW: 'bg-yellow-500/20 text-yellow-400',
  APPROVED: 'bg-green-500/20 text-green-400',
  LIVE: 'bg-blue-500/20 text-blue-400',
  REJECTED: 'bg-red-500/20 text-red-400',
};

export default function ReleasesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Releases</h1>
          <p className="text-sm text-muted-foreground mt-1">Catálogo de releases e distribuição</p>
        </div>
        <Link
          href="/releases/new"
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Novo Release
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['Todos', 'Rascunho', 'Em revisão', 'Aprovados', 'Live'].map((f) => (
          <button
            key={f}
            className="rounded-full border px-3 py-1 text-xs font-medium hover:bg-accent first:bg-accent first:border-ring"
          >
            {f}
          </button>
        ))}
      </div>

      <div className="rounded-lg border bg-card">
        <div className="p-8 text-center text-sm text-muted-foreground">
          Nenhum release encontrado.
        </div>
      </div>
    </div>
  );
}
