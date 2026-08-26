"use client";

import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  Banknote,
  Clock,
  Coins,
  TrendingUp,
} from "lucide-react";
import { useListingBrowseLoading } from "@/components/listing-browse-loading";
import {
  buildBrowseHref,
  nextSortSelection,
  parseListingSort,
  pickFilterParamsOnly,
  sortDirectionLabel,
  sortOptionsForType,
  sortToQueryParams,
  type ListingSortField,
} from "@/lib/listings/sort";
import { cn } from "@/lib/utils";

const SORT_ICONS: Record<
  ListingSortField,
  React.ComponentType<{ className?: string }>
> = {
  level: TrendingUp,
  price_brl: Banknote,
  price_coins: Coins,
  newest: Clock,
};

export function ListingSortBar({
  basePath,
  listingType,
  searchParams,
  resultCount,
}: {
  basePath: string;
  listingType: "character" | "items" | "all";
  searchParams: Record<string, string | undefined>;
  resultCount?: number;
}) {
  const { isFiltering, pendingSort, filter } = useListingBrowseLoading();
  const appliedSort = parseListingSort(searchParams, listingType);
  const activeSort = pendingSort ?? appliedSort;
  const options = sortOptionsForType(listingType);

  return (
    <div
      className={cn(
        "mb-6 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card)] transition",
        isFiltering && "opacity-80",
      )}
    >
      <div className="flex flex-col gap-3 border-b border-[var(--color-card-border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--color-foreground)]">
            Ordenação
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
            {sortDirectionLabel(activeSort.dir)}
            {isFiltering && (
              <>
                {" "}
                ·{" "}
                <span className="text-[var(--color-primary)]">
                  Atualizando lista…
                </span>
              </>
            )}
            {!isFiltering && resultCount != null && (
              <>
                {" "}
                · {resultCount}{" "}
                {resultCount === 1 ? "resultado" : "resultados"}
              </>
            )}
          </p>
        </div>

        <p className="hidden text-[11px] text-[var(--color-muted-foreground)] sm:block">
          Toque de novo no critério ativo para inverter a ordem
        </p>
      </div>

      <div className="app-scroll app-scroll-x max-w-full overflow-x-auto p-3">
        <div
          className="inline-flex min-w-max gap-1.5"
          role="radiogroup"
          aria-label="Ordenar anúncios"
        >
          {options.map((option) => {
            const Icon = SORT_ICONS[option.id];
            const isActive = activeSort.field === option.id;
            const DirectionIcon =
              activeSort.dir === "desc"
                ? ArrowDownWideNarrow
                : ArrowUpWideNarrow;

            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={isActive}
                title={option.hint}
                aria-busy={isFiltering && isActive}
                onClick={() => {
                  const next = nextSortSelection(activeSort, option.id);
                  const href = buildBrowseHref(basePath, {
                    ...(listingType === "character" || listingType === "items"
                      ? pickFilterParamsOnly(searchParams, listingType)
                      : {}),
                    ...sortToQueryParams(next, listingType),
                  });
                  filter(href);
                }}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium whitespace-nowrap transition",
                  isActive
                    ? "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/12 text-[var(--color-primary)] shadow-sm"
                    : "border-[var(--color-card-border)] bg-[var(--color-accent)]/35 text-[var(--color-muted)] hover:border-zinc-600 hover:text-[var(--color-foreground)]",
                  isFiltering && "cursor-wait",
                  isFiltering && !isActive && "opacity-70",
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
                <span>{option.shortLabel}</span>
                {isActive && (
                  <DirectionIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
