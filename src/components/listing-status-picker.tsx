"use client";

import { Badge } from "@/components/ui";
import {
  LISTING_STATUS_META,
  LISTING_STATUS_ORDER,
} from "@/lib/listings/status-meta";
import {
  LISTING_STATUS_COLORS,
  LISTING_STATUS_LABELS,
  cn,
} from "@/lib/utils";

export function ListingStatusPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (status: string) => void;
}) {
  const currentLabel = LISTING_STATUS_LABELS[value] ?? value;
  const currentColor =
    LISTING_STATUS_COLORS[value] ?? LISTING_STATUS_COLORS.draft;

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-zinc-200">Status do anúncio</p>
        <Badge className={cn("shrink-0", currentColor)}>{currentLabel}</Badge>
      </div>

      <div className="flex min-w-0 flex-col gap-1.5">
        {LISTING_STATUS_ORDER.map((status) => {
          const meta = LISTING_STATUS_META[status];
          const Icon = meta.icon;
          const active = value === status;

          return (
            <button
              key={status}
              type="button"
              onClick={() => onChange(status)}
              className={cn(
                "flex w-full min-w-0 items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition",
                active
                  ? "border-[var(--color-primary)]/60 bg-[var(--color-primary)]/10 ring-1 ring-[var(--color-primary)]/20"
                  : "border-[var(--color-card-border)] bg-[var(--color-accent)]/40 hover:border-zinc-600",
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                  active
                    ? LISTING_STATUS_COLORS[status]
                    : "bg-zinc-800/90 text-zinc-500",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "truncate text-sm font-medium",
                    active ? "text-zinc-100" : "text-zinc-300",
                  )}
                >
                  {LISTING_STATUS_LABELS[status]}
                </p>
                <p className="truncate text-[11px] text-zinc-500">{meta.hint}</p>
              </div>
              <span
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  active ? "bg-[var(--color-primary)]" : "bg-zinc-700",
                )}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
