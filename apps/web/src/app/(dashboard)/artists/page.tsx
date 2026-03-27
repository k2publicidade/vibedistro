import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export const metadata: Metadata = { title: 'Artistas' };

export default function ArtistsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Artistas</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie seus artistas</p>
        </div>
        <Link
          href="/artists/new"
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Novo Artista
        </Link>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <input
            type="search"
            placeholder="Buscar artistas..."
            className="w-full max-w-sm rounded-md border bg-transparent px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="p-8 text-center text-sm text-muted-foreground">
          Nenhum artista cadastrado. Crie o primeiro artista para começar.
        </div>
      </div>
    </div>
  );
}
