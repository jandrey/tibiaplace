import Link from "next/link";
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  Banknote,
  Clock,
  Coins,
  TrendingUp,
} from "lucide-react";
import {
  buildBrowseHref,
  buildSortHref,
  parseListingSort,
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

type AdminListingTypeFilter = "all" | "character" | "items";
type AdminListingStatusFilter = "all" | "active" | "sold" | "archived";

function adminSortContext(typeFilter: AdminListingTypeFilter) {
  if (typeFilter === "items") return "items" as const;
  if (typeFilter === "character") return "character" as const;
  return "all" as const;
}

export function adminListingsHref({
  typeFilter = "all",
  statusFilter = "all",
  page,
  searchParams = {},
}: {
  typeFilter?: AdminListingTypeFilter;
  statusFilter?: AdminListingStatusFilter;
  page?: number;
  searchParams?: Record<string, string | undefined>;
}) {
  const sortContext = adminSortContext(typeFilter);
  const sort = parseListingSort(searchParams, sortContext);

  return buildBrowseHref("/admin/listings", {
    ...(typeFilter !== "all" ? { type: typeFilter } : {}),
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    ...(page && page > 1 ? { page: String(page) } : {}),
    ...sortToQueryParams(sort, sortContext),
  });
}

export function AdminListingSortBar({
  typeFilter,
  searchParams,
  resultCount,
}: {
  typeFilter: AdminListingTypeFilter;
  searchParams: Record<string, string | undefined>;
  resultCount?: number;
}) {
  const listingType = adminSortContext(typeFilter);
  const activeSort = parseListingSort(searchParams, listingType);
  const options = sortOptionsForType(listingType);
  const statusFilter = (searchParams.status ?? "all") as AdminListingStatusFilter;
  const page = searchParams.page ? Number.parseInt(searchParams.page, 10) : 1;

  const extraParams: Record<string, string | undefined> = {
    ...(typeFilter !== "all" ? { type: typeFilter } : {}),
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    ...(page > 1 ? { page: String(page) } : {}),
  };

  return (
    <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface)]">
      <div className="flex flex-col gap-3 border-b border-[var(--color-card-border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-100">Ordenação</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {sortDirectionLabel(activeSort.dir)}
            {resultCount != null && (
              <>
                {" "}
                · {resultCount}{" "}
                {resultCount === 1 ? "resultado" : "resultados"}
              </>
            )}
          </p>
        </div>
        <p className="hidden text-[11px] text-zinc-500 sm:block">
          Clique de novo no critério ativo para inverter a ordem
        </p>
      </div>

      <div className="app-scroll app-scroll-x max-w-full overflow-x-auto p-3">
        <div className="inline-flex min-w-max gap-1.5" role="radiogroup" aria-label="Ordenar anúncios">
          {options.map((option) => {
            const Icon = SORT_ICONS[option.id];
            const isActive = activeSort.field === option.id;
            const DirectionIcon =
              activeSort.dir === "desc"
                ? ArrowDownWideNarrow
                : ArrowUpWideNarrow;

            return (
              <Link
                key={option.id}
                href={buildSortHref(
                  "/admin/listings",
                  searchParams,
                  listingType,
                  option.id,
                  extraParams,
                )}
                role="radio"
                aria-checked={isActive}
                title={option.hint}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium whitespace-nowrap transition",
                  isActive
                    ? "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/12 text-[var(--color-primary)]"
                    : "border-[var(--color-card-border)] bg-[var(--color-accent)]/35 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200",
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
                <span>{option.shortLabel}</span>
                {isActive && (
                  <DirectionIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
