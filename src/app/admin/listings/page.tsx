import Link from "next/link";
import { getAdminListings } from "@/lib/queries/listings";
import { Badge, Card } from "@/components/ui";
import {
  LISTING_TYPE_LABELS,
  listingDisplayNameForType,
  listingPublicPath,
  parseCoinsTypeData,
  parseItemTypeData,
} from "@/lib/listings/types";
import {
  formatBrl,
  LISTING_STATUS_COLORS,
  LISTING_STATUS_LABELS,
} from "@/lib/utils";

function listingSubtitle(listing: Awaited<ReturnType<typeof getAdminListings>>[number]) {
  if (listing.type === "rubini_coins") {
    const coins = parseCoinsTypeData(listing.typeData);
    return `${coins ? `${coins.coinAmount.toLocaleString("pt-BR")} coins` : "Coins"} · ${listing.worldName ?? "—"}`;
  }
  if (listing.type === "items") {
    const item = parseItemTypeData(listing.typeData);
    const qty = item && item.count > 1 ? `${item.count}x ` : "";
    return `${item ? `${qty}${item.name}` : "Item"} · ${listing.worldName ?? "—"}`;
  }
  return `${listing.vocation ?? "—"} ${listing.level ?? "—"} · ${listing.worldName ?? "—"}`;
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

export default async function AdminListingsPage() {
  const listings = (await getAdminListings(true)).filter(
    (listing) => listing.type !== "rubini_coins",
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Anúncios</h1>
          <p className="mt-2 text-zinc-400">
            Personagens e itens. Rubini Coins em{" "}
            <Link href="/admin/settings" className="text-[var(--color-primary)]">
              Configurações
            </Link>
            .
          </p>
        </div>
        <Link
          href="/admin/listings/new"
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-black"
        >
          Novo anúncio
        </Link>
      </div>

      <div className="mt-8 space-y-3">
        {listings.length === 0 ? (
          <Card className="text-center text-zinc-400">
            Nenhum anúncio ainda.{" "}
            <Link
              href="/admin/listings/new"
              className="text-[var(--color-primary)]"
            >
              Criar anúncio
            </Link>
          </Card>
        ) : (
          listings.map((listing) => (
            <Card
              key={listing.id}
              className="transition hover:border-[var(--color-primary)]/40"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">
                      {listingDisplayNameForType(listing)}
                    </h3>
                    <Badge className={typeBadgeClass(listing.type)}>
                      {LISTING_TYPE_LABELS[listing.type as keyof typeof LISTING_TYPE_LABELS] ??
                        "Anúncio"}
                    </Badge>
                  </div>
                  <p className="text-sm text-zinc-400">{listingSubtitle(listing)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={LISTING_STATUS_COLORS[listing.status]}>
                    {LISTING_STATUS_LABELS[listing.status]}
                  </Badge>
                  {listing.featured && (
                    <Badge className="bg-[var(--color-primary)]/20 text-[var(--color-primary)]">
                      Destaque
                    </Badge>
                  )}
                  {listing.priceBrl && (
                    <span className="text-sm text-emerald-400">
                      {formatBrl(listing.priceBrl)}
                    </span>
                  )}
                  {listing.status === "available" && (
                    <Link
                      href={listingPublicPath(listing.type, listing.slug)}
                      className="rounded-md border border-[var(--color-card-border)] px-3 py-1.5 text-xs text-zinc-300 hover:text-white"
                    >
                      Ver
                    </Link>
                  )}
                  <Link
                    href={`/admin/listings/${listing.id}`}
                    className="rounded-md bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-black"
                  >
                    Editar
                  </Link>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
