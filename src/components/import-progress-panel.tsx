"use client";

import { cn } from "@/lib/utils";
import type { ImportProgressEvent } from "@/lib/bazaar/import-progress";

export function ImportProgressPanel({
  progress,
  label,
  detail,
  className,
}: {
  progress: number;
  label: string;
  detail?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "space-y-3 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-accent)]/60 p-4",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3 text-sm">
        <div className="min-w-0">
          <p className="font-medium text-zinc-200">{label}</p>
          {detail ? (
            <p className="mt-0.5 truncate text-xs text-zinc-500">{detail}</p>
          ) : null}
        </div>
        <span className="shrink-0 tabular-nums font-semibold text-[var(--color-primary)]">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-800/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-600 to-[var(--color-primary)] transition-[width] duration-200 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}

export function importEventLabel(event: ImportProgressEvent) {
  return event.detail ? `${event.label} — ${event.detail}` : event.label;
}
