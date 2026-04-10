'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { ReleaseStatus } from '@/lib/types';

// ---------------------------------------------------------------------------
// Status flow steps (in order)
// ---------------------------------------------------------------------------

interface FlowStep {
  status: ReleaseStatus;
  label: string;
  color: string;
}

const FLOW_STEPS: FlowStep[] = [
  { status: 'DRAFT', label: 'Rascunho', color: '#6b7280' },
  { status: 'PENDING_REVIEW', label: 'Em Revisao', color: '#eab308' },
  { status: 'APPROVED', label: 'Aprovado', color: '#22c55e' },
  { status: 'SUBMITTED', label: 'Submetido', color: '#8b5cf6' },
  { status: 'DELIVERED', label: 'Entregue', color: '#06b6d4' },
  { status: 'LIVE', label: 'Live', color: '#3b82f6' },
];

// Map each status to its index in the flow (statuses not in the happy path are handled below)
const STATUS_INDEX: Record<string, number> = {};
FLOW_STEPS.forEach((s, i) => {
  STATUS_INDEX[s.status] = i;
});

// Statuses that break out of the happy path
const TERMINAL_STATUSES: Record<string, { label: string; color: string }> = {
  REJECTED: { label: 'Rejeitado', color: '#ef4444' },
  CHANGES_REQUESTED: { label: 'Mudancas Solicitadas', color: '#f97316' },
  TAKEDOWN_REQUESTED: { label: 'Takedown Solicitado', color: '#991b1b' },
  TAKEN_DOWN: { label: 'Removido', color: '#991b1b' },
  ARCHIVED: { label: 'Arquivado', color: '#6b7280' },
  SCHEDULED: { label: 'Agendado', color: '#a855f7' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ReleaseStatusFlowProps {
  currentStatus: ReleaseStatus;
  className?: string;
}

export function ReleaseStatusFlow({
  currentStatus,
  className,
}: ReleaseStatusFlowProps) {
  const currentIndex = STATUS_INDEX[currentStatus] ?? -1;
  const isTerminal = currentStatus in TERMINAL_STATUSES;

  return (
    <div className={cn('w-full', className)}>
      {/* Flow steps */}
      <div className="flex items-center gap-0">
        {FLOW_STEPS.map((step, i) => {
          const isCompleted = currentIndex > i;
          const isCurrent = currentIndex === i && !isTerminal;
          const isActive = isCompleted || isCurrent;

          return (
            <div key={step.status} className="flex items-center flex-1 last:flex-none">
              {/* Step circle */}
              <div className="flex flex-col items-center gap-1.5 relative z-10">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2',
                    isCompleted
                      ? 'border-transparent text-white'
                      : isCurrent
                        ? 'border-current animate-pulse'
                        : 'border-border bg-secondary text-muted-foreground',
                  )}
                  style={
                    isCompleted
                      ? { backgroundColor: step.color }
                      : isCurrent
                        ? { color: step.color, borderColor: step.color }
                        : undefined
                  }
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'text-[10px] font-medium whitespace-nowrap',
                    isActive ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {i < FLOW_STEPS.length - 1 && (
                <div className="flex-1 mx-1">
                  <div
                    className={cn(
                      'h-0.5 w-full rounded-full transition-all',
                      currentIndex > i ? 'bg-primary' : 'bg-border',
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Terminal status indicator */}
      {isTerminal && TERMINAL_STATUSES[currentStatus] && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: TERMINAL_STATUSES[currentStatus].color }}
          />
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: TERMINAL_STATUSES[currentStatus].color }}
          >
            {TERMINAL_STATUSES[currentStatus].label}
          </span>
        </div>
      )}
    </div>
  );
}
