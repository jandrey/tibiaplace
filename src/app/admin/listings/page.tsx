export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, User, Package } from "lucide-react";
import {
  AdminListingSortBar,
  adminListingsHref,
} from "@/components/admin-listing-sort-bar";
import { getAdminListings } from "@/lib/queries/listings";
import { Card } from "@/components/ui";
import { AdminListingsList } from "@/components/admin-listings-list";
import { AdminListingsPagination } from "@/components/admin-listings-pagination";
import {
  paginateAdminListings,
  parseAdminListingsPage,
} from "@/lib/listings/admin-pagination";
import { parseListingSort, sortListingRows } from "@/lib/listings/sort";
import { cn } from "@/lib/utils";

type AdminListingTypeFilter = "all" | "character" | "items";
type AdminListingStatusFilter = "all" | "active" | "sold" | "archived";

const TYPE_FILTERS: Array<{
  id: AdminListingTypeFilter;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}> = [
  { id: "all", label: "Todos" },
  { id: "character", label: "Personagens", icon: User },
  { id: "items", label: "Itens", icon: Package },
];

const STATUS_FILTERS: Array<{
  id: AdminListingStatusFilter;
  label: string;
}> = [
  { id: "all", label: "Todos" },
  { id: "active", label: "Ativos" },
  { id: "sold", label: "Vendidos" },
  { id: "archived", label: "Arquivados" },
];

function parseTypeFilter(value: string | undefined): AdminListingTypeFilter {
  if (value === "character" || value === "items") return value;
  return "all";
}

function parseStatusFilter(value: string | undefined): AdminListingStatusFilter {
  if (value === "active" || value === "sold" || value === "archived") return value;
  return "all";
}

function matchesStatusFilter(
  status: string,
  filter: AdminListingStatusFilter,
): boolean {
  if (filter === "all") return true;
  if (filter === "active") {
    return status === "draft" || status === "available" || status === "reserved";
  }
  return status === filter;
}

function adminSortContext(typeFilter: AdminListingTypeFilter) {
  if (typeFilter === "items") return "items" as const;
  if (typeFilter === "character") return "character" as const;
  return "all" as const;
}

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    status?: string;
    page?: string;
    sort?: string;
    dir?: string;
  }>;
}) {
  const params = await searchParams;
  const typeFilter = parseTypeFilter(params.type);
  const statusFilter = parseStatusFilter(params.status);
  const page = parseAdminListingsPage(params.page);
  const sort = parseListingSort(params, adminSortContext(typeFilter));

  const allListings = (await getAdminListings()).filter(
    (listing) => listing.type !== "rubini_coins",
  );

  const filtered = allListings.filter((listing) => {
    const typeOk = typeFilter === "all" ? true : listing.type === typeFilter;
    const statusOk = matchesStatusFilter(listing.status, statusFilter);
    return typeOk && statusOk;
  });

  const listings = sortListingRows(filtered, sort, "admin");
  const pagination = paginateAdminListings(listings, page);

  const countsForType = (type: AdminListingTypeFilter) => {
    const base =
      type === "all"
        ? allListings
        : allListings.filter((listing) => listing.type === type);
    return base.length;
  };

  const countsForStatus = (status: AdminListingStatusFilter) => {
    const base =
      typeFilter === "all"
        ? allListings
        : allListings.filter((listing) => listing.type === typeFilter);
    return base.filter((listing) => matchesStatusFilter(listing.status, status))
      .length;
  };

  const hrefForPage = (nextPage: number) =>
    adminListingsHref({
      typeFilter,
      statusFilter,
      page: nextPage,
      searchParams: params,
    });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-[var(--color-card-border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Anúncios</h1>
          <p className="mt-1.5 max-w-xl text-sm text-zinc-400">
            Gerencie personagens e itens. Rubini Coins ficam em{" "}
            <Link
              href="/admin/settings"
              className="text-[var(--color-primary)] hover:underline"
            >
              Configurações
            </Link>
            .
          </p>
        </div>
        <Link
          href="/admin/listings/new"
          className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 text-sm font-medium text-black transition hover:brightness-110 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Novo anúncio
        </Link>
      </header>

      <section className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface)] p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="app-scroll app-scroll-x max-w-full overflow-x-auto">
            <div className="inline-flex min-w-max gap-1 rounded-lg bg-[var(--color-accent)]/40 p-1">
              {TYPE_FILTERS.map((filter) => {
                const isActive = typeFilter === filter.id;
                const Icon = filter.icon;
                return (
                  <Link
                    key={filter.id}
                    href={adminListingsHref({
                      typeFilter: filter.id,
                      statusFilter,
                      searchParams: params,
                    })}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition",
                      isActive
                        ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-sm"
                        : "text-zinc-400 hover:text-zinc-200",
                    )}
                  >
                    {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
                    {filter.label}
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-px text-[10px] tabular-nums",
                        isActive
                          ? "bg-black/20"
                          : "bg-black/20 text-zinc-500",
                      )}
                    >
                      {countsForType(filter.id)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="app-scroll app-scroll-x max-w-full overflow-x-auto lg:max-w-none">
            <div className="inline-flex min-w-max gap-1">
              {STATUS_FILTERS.map((filter) => {
                const isActive = statusFilter === filter.id;
                return (
                  <Link
                    key={filter.id}
                    href={adminListingsHref({
                      typeFilter,
                      statusFilter: filter.id,
                      searchParams: params,
                    })}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition",
                      isActive
                        ? "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                        : "border-[var(--color-card-border)] text-zinc-500 hover:border-zinc-600 hover:text-zinc-300",
                    )}
                  >
                    {filter.label}
                    <span className="tabular-nums opacity-70">
                      {countsForStatus(filter.id)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <AdminListingSortBar
        typeFilter={typeFilter}
        searchParams={params}
        resultCount={listings.length}
      />

      {pagination.items.length === 0 ? (
        <Card className="py-12 text-center text-sm text-zinc-400">
          {allListings.length === 0 ? (
            <>
              Nenhum anúncio ainda.{" "}
              <Link
                href="/admin/listings/new"
                className="text-[var(--color-primary)] hover:underline"
              >
                Criar anúncio
              </Link>
            </>
          ) : (
            <>
              Nenhum anúncio neste filtro.{" "}
              <Link
                href="/admin/listings"
                className="text-[var(--color-primary)] hover:underline"
              >
                Ver todos
              </Link>
            </>
          )}
        </Card>
      ) : (
        <>
          <AdminListingsList
            listings={pagination.items}
            startIndex={pagination.startIndex}
          />

          <AdminListingsPagination
            current={pagination.current}
            totalPages={pagination.totalPages}
            total={pagination.total}
            startIndex={pagination.startIndex}
            pageSize={pagination.pageSize}
            hrefForPage={hrefForPage}
          />
        </>
      )}
    </div>
  );
}
