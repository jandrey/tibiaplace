import Link from "next/link";
import { Star } from "lucide-react";
import { AdminListingActionsMenu } from "@/components/admin-listing-actions-menu";
import { ItemListingImage } from "@/components/item-listing-image";
import { VocationTag } from "@/components/vocation-tag";
import { Badge } from "@/components/ui";
import {
  LISTING_TYPE_LABELS,
  listingDisplayNameForType,
  listingPublicPath,
  parseCoinsTypeData,
  parseItemTypeData,
} from "@/lib/listings/types";
import type { getAdminListings } from "@/lib/queries/listings";
import {
  formatBrl,
  LISTING_STATUS_COLORS,
  LISTING_STATUS_LABELS,
  cn,
} from "@/lib/utils";

type AdminListing = Awaited<ReturnType<typeof getAdminListings>>[number];

function listingSubtitle(listing: AdminListing) {
  if (listing.type === "rubini_coins") {
    const coins = parseCoinsTypeData(listing.typeData);
    return `${coins ? `${coins.coinAmount.toLocaleString("pt-BR")} coins` : "Coins"} · ${listing.worldName ?? "—"}`;
  }
  if (listing.type === "items") {
    const item = parseItemTypeData(listing.typeData);
    const qty = item && item.count > 1 ? `${item.count}x ` : "";
    return `${item ? `${qty}${item.name}` : "Item"} · ${listing.worldName ?? "—"}`;
  }
  const vocation = listing.vocation ?? "—";
  const level = listing.level ?? "—";
  return `${vocation} · Lv ${level}`;
}

function typeBadgeClass(type: string) {
  switch (type) {
    case "rubini_coins":
      return "bg-amber-500/15 text-amber-300";
    case "items":
      return "bg-sky-500/15 text-sky-300";
    default:
      return "bg-[var(--color-accent)] text-zinc-300";
  }
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={cn("text-[11px] font-medium", LISTING_STATUS_COLORS[status])}>
      {LISTING_STATUS_LABELS[status]}
    </Badge>
  );
}

function ListingActions({
  listing,
}: {
  listing: AdminListing;
}) {
  const canViewPublic = listing.status === "available";
  const publicPath = listingPublicPath(listing.type, listing.slug);
  const editPath = `/admin/listings/${listing.id}`;

  return (
    <div className="flex items-center justify-end gap-1">
      {canViewPublic && (
        <Link
          href={publicPath}
          className="hidden h-8 items-center rounded-lg px-2.5 text-xs text-zinc-400 transition hover:bg-[var(--color-accent)] hover:text-white lg:inline-flex"
        >
          Ver
        </Link>
      )}
      <Link
        href={editPath}
        className="hidden h-8 items-center rounded-lg bg-[var(--color-primary)]/90 px-3 text-xs font-medium text-black transition hover:bg-[var(--color-primary)] lg:inline-flex"
      >
        Editar
      </Link>
      <AdminListingActionsMenu
        listingId={listing.id}
        status={listing.status}
        featured={listing.featured}
        canViewPublic={canViewPublic}
        publicPath={publicPath}
        editPath={editPath}
      />
    </div>
  );
}

function ListingAvatar({
  listing,
  compact = false,
}: {
  listing: AdminListing;
  compact?: boolean;
}) {
  const frameClass = cn(
    "rounded-md border border-[var(--color-card-border)] bg-[var(--color-accent)]/60 shadow-sm",
    compact ? "h-9 w-7" : "h-10 w-8",
  );

  if (listing.type === "character" && listing.vocation) {
    return (
      <VocationTag
        vocation={listing.vocation}
        className={cn(compact ? "h-9 w-7" : "h-10 w-8")}
      />
    );
  }

  if (listing.type === "items") {
    const item = parseItemTypeData(listing.typeData);
    return (
      <ItemListingImage
        item={item}
        fitFrame
        frameClassName={frameClass}
        className="p-0.5"
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md border border-[var(--color-card-border)] bg-[var(--color-accent)]/40",
        compact ? "h-9 w-7" : "h-10 w-8",
      )}
      aria-hidden
    />
  );
}

function ListingIdentity({
  listing,
  compact = false,
}: {
  listing: AdminListing;
  compact?: boolean;
}) {
  const name = listingDisplayNameForType(listing);
  const subtitle = listingSubtitle(listing);
  const typeLabel =
    LISTING_TYPE_LABELS[listing.type as keyof typeof LISTING_TYPE_LABELS] ??
    "Anúncio";

  return (
    <div className="flex min-w-0 items-center gap-3">
      <ListingAvatar listing={listing} compact={compact} />
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate font-semibold text-zinc-100">{name}</p>
          {listing.featured && (
            <Star
              className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400"
              aria-label="Destaque"
            />
          )}
        </div>
        <p className="truncate text-xs text-zinc-500">{subtitle}</p>
        {compact && (
          <Badge className={cn("mt-1.5 text-[10px]", typeBadgeClass(listing.type))}>
            {typeLabel}
          </Badge>
        )}
      </div>
    </div>
  );
}

function DesktopRow({
  listing,
  index,
}: {
  listing: AdminListing;
  index: number;
}) {
  const isInactive = listing.status === "sold" || listing.status === "archived";
  const typeLabel =
    LISTING_TYPE_LABELS[listing.type as keyof typeof LISTING_TYPE_LABELS] ??
    "Anúncio";

  return (
    <tr
      className={cn(
        "group border-b border-[var(--color-card-border)]/70 transition last:border-0",
        "hover:bg-[var(--color-accent)]/25",
        isInactive && "opacity-70",
      )}
    >
      <td className="w-12 px-4 py-3 text-center text-xs font-medium tabular-nums text-zinc-500">
        {index}
      </td>
      <td className="min-w-[220px] px-4 py-3">
        <ListingIdentity listing={listing} />
      </td>
      <td className="hidden w-32 px-4 py-3 xl:table-cell">
        <Badge className={cn("text-[11px]", typeBadgeClass(listing.type))}>
          {typeLabel}
        </Badge>
      </td>
      <td className="w-36 px-4 py-3">
        <StatusBadge status={listing.status} />
      </td>
      <td className="w-36 px-4 py-3 text-right text-sm font-medium tabular-nums text-emerald-400">
        {listing.priceBrl ? formatBrl(listing.priceBrl) : (
          <span className="text-zinc-600">—</span>
        )}
      </td>
      <td className="relative w-36 px-4 py-3">
        <ListingActions listing={listing} />
      </td>
    </tr>
  );
}

function MobileRow({
  listing,
  index,
}: {
  listing: AdminListing;
  index: number;
}) {
  const isInactive = listing.status === "sold" || listing.status === "archived";

  return (
    <article
      className={cn(
        "relative rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface)]",
        isInactive && "opacity-75",
      )}
    >
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-1",
          listing.status === "available" && "bg-emerald-500",
          listing.status === "draft" && "bg-zinc-600",
          listing.status === "reserved" && "bg-amber-500",
          listing.status === "sold" && "bg-sky-500",
          listing.status === "archived" && "bg-zinc-700",
        )}
        aria-hidden
      />

      <div className="flex items-start gap-2 p-3 pl-4">
        <span className="mt-0.5 w-5 shrink-0 text-center text-[11px] font-semibold tabular-nums text-zinc-500">
          {index}
        </span>

        <div className="min-w-0 flex-1">
          <ListingIdentity listing={listing} compact />

          <div className="mt-2.5 flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <StatusBadge status={listing.status} />
              {listing.priceBrl && (
                <span className="text-sm font-semibold tabular-nums text-emerald-400">
                  {formatBrl(listing.priceBrl)}
                </span>
              )}
            </div>
            <ListingActions listing={listing} />
          </div>
        </div>
      </div>
    </article>
  );
}

export function AdminListingsList({
  listings,
  startIndex,
}: {
  listings: AdminListing[];
  startIndex: number;
}) {
  return (
    <>
      <div className="hidden rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface)] lg:block">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--color-card-border)] bg-[var(--color-accent)]/30 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                <th className="w-12 px-4 py-3 text-center">#</th>
                <th className="px-4 py-3">Anúncio</th>
                <th className="hidden px-4 py-3 xl:table-cell">Tipo</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Preço</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing, i) => (
                <DesktopRow
                  key={listing.id}
                  listing={listing}
                  index={startIndex + i + 1}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-2 lg:hidden">
        {listings.map((listing, i) => (
          <MobileRow
            key={listing.id}
            listing={listing}
            index={startIndex + i + 1}
          />
        ))}
      </div>
    </>
  );
}
