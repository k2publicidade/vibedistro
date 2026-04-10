'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Download } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useRoyaltyStatement } from '@/lib/hooks/use-royalties';
import type { RoyaltyStatementStatus } from '@/lib/types';

// ---- Helpers ----

function formatCurrency(cents: number): string {
  const value = cents / 100;
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('pt-BR');
}

const STATUS_CONFIG: Record<
  RoyaltyStatementStatus,
  { label: string; className: string }
> = {
  DRAFT: {
    label: 'Rascunho',
    className: 'bg-muted text-muted-foreground border-border',
  },
  PROCESSING: {
    label: 'Processando',
    className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  },
  AVAILABLE: {
    label: 'Disponivel',
    className: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  },
  DISPUTED: {
    label: 'Disputado',
    className: 'bg-red-500/10 text-red-500 border-red-500/20',
  },
  FINAL: {
    label: 'Final',
    className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  },
};

// ---- Props ----

interface StatementDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statementId: string;
}

// ---- Component ----

export function StatementDetailSheet({
  open,
  onOpenChange,
  statementId,
}: StatementDetailSheetProps) {
  const { data: statement, isLoading } = useRoyaltyStatement(statementId, {
    enabled: open && !!statementId,
  });

  const entries = statement?.entries ?? [];

  // Group entries by track
  const byTrack = new Map<
    string,
    { title: string; streams: number; gross: number; net: number }
  >();
  // Group entries by platform
  const byPlatform = new Map<
    string,
    { streams: number; total: number }
  >();

  for (const entry of entries) {
    const trackKey = entry.trackIsrc ?? 'unknown';
    const existing = byTrack.get(trackKey);
    if (existing) {
      existing.streams += entry.streams;
      existing.gross += entry.grossRevenueCents;
      existing.net += entry.netRevenueCents;
    } else {
      byTrack.set(trackKey, {
        title: entry.trackIsrc ?? 'Sem ISRC',
        streams: entry.streams,
        gross: entry.grossRevenueCents,
        net: entry.netRevenueCents,
      });
    }

    const dsp = entry.dspName ?? 'Outro';
    const existingPlatform = byPlatform.get(dsp);
    if (existingPlatform) {
      existingPlatform.streams += entry.streams;
      existingPlatform.total += entry.grossRevenueCents;
    } else {
      byPlatform.set(dsp, {
        streams: entry.streams,
        total: entry.grossRevenueCents,
      });
    }
  }

  const trackRows = Array.from(byTrack.entries());
  const platformRows = Array.from(byPlatform.entries());

  const totalGross = entries.reduce((s, e) => s + e.grossRevenueCents, 0);
  const totalNet = entries.reduce((s, e) => s + e.netRevenueCents, 0);
  const totalStreams = entries.reduce((s, e) => s + e.streams, 0);

  const statusCfg = statement
    ? STATUS_CONFIG[statement.status] ?? STATUS_CONFIG.DRAFT
    : STATUS_CONFIG.DRAFT;

  const handleExportCsv = () => {
    if (!statement || entries.length === 0) return;
    const header = 'ISRC,DSP,Territorio,Periodo,Streams,Bruto,Liquido\n';
    const rows = entries
      .map(
        (e) =>
          `${e.trackIsrc ?? ''},${e.dspName ?? ''},${e.territory ?? ''},${e.period},${e.streams},${(e.grossRevenueCents / 100).toFixed(2)},${(e.netRevenueCents / 100).toFixed(2)}`,
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statement-${statement.period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isLoading ? (
              <Skeleton className="h-6 w-40" />
            ) : (
              <span>Statement - {statement?.period ?? ''}</span>
            )}
          </SheetTitle>
          <SheetDescription>
            {isLoading ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              <Badge
                className={cn(
                  'text-[10px] font-semibold uppercase tracking-wider border',
                  statusCfg.className,
                )}
              >
                {statusCfg.label}
              </Badge>
            )}
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-4 mt-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-6 mt-6">
            {/* By Track */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Por Track</h3>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-muted-foreground pb-2">
                        Track / ISRC
                      </th>
                      <th className="text-right text-xs font-medium text-muted-foreground pb-2">
                        Streams
                      </th>
                      <th className="text-right text-xs font-medium text-muted-foreground pb-2">
                        Bruto
                      </th>
                      <th className="text-right text-xs font-medium text-muted-foreground pb-2">
                        Liquido
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {trackRows.map(([key, row]) => (
                      <tr
                        key={key}
                        className="border-b border-border/50 last:border-0"
                      >
                        <td className="py-2 font-mono text-xs">{row.title}</td>
                        <td className="py-2 text-right tabular-nums">
                          {formatNumber(row.streams)}
                        </td>
                        <td className="py-2 text-right tabular-nums text-xs">
                          {formatCurrency(row.gross)}
                        </td>
                        <td className="py-2 text-right tabular-nums text-xs">
                          {formatCurrency(row.net)}
                        </td>
                      </tr>
                    ))}
                    {trackRows.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-4 text-center text-xs text-muted-foreground"
                        >
                          Sem dados de tracks
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* By Platform */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Por Plataforma</h3>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-muted-foreground pb-2">
                        DSP
                      </th>
                      <th className="text-right text-xs font-medium text-muted-foreground pb-2">
                        Streams
                      </th>
                      <th className="text-right text-xs font-medium text-muted-foreground pb-2">
                        Valor
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {platformRows.map(([dsp, row]) => (
                      <tr
                        key={dsp}
                        className="border-b border-border/50 last:border-0"
                      >
                        <td className="py-2">{dsp}</td>
                        <td className="py-2 text-right tabular-nums">
                          {formatNumber(row.streams)}
                        </td>
                        <td className="py-2 text-right tabular-nums text-xs">
                          {formatCurrency(row.total)}
                        </td>
                      </tr>
                    ))}
                    {platformRows.length === 0 && (
                      <tr>
                        <td
                          colSpan={3}
                          className="py-4 text-center text-xs text-muted-foreground"
                        >
                          Sem dados de plataformas
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals Summary */}
            <div className="rounded-lg border border-border p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Streams</span>
                <span className="font-semibold tabular-nums">
                  {formatNumber(totalStreams)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Receita Bruta</span>
                <span className="font-semibold tabular-nums">
                  {formatCurrency(totalGross)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Receita Liquida</span>
                <span className="font-semibold tabular-nums text-emerald-500">
                  {formatCurrency(totalNet)}
                </span>
              </div>
            </div>
          </div>
        )}

        <SheetFooter className="mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={isLoading || entries.length === 0}
            className="gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Exportar CSV
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
