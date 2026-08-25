import Link from "next/link";
import { Sparkles } from "lucide-react";
import { buildOutfitImageUrl } from "@/lib/bazaar/types";
import {
  getListingBadges,
  getListingLevelPercent,
  getListingSkills,
} from "@/lib/bazaar/snapshot";
import { ListingBuyButton } from "@/components/listing-buy-button";
import { ItemListingCard } from "@/components/item-listing-card";
import { OutfitSprite } from "@/components/outfit-sprite";
import { SkillGrid } from "@/components/skill-bar";
import { Badge, Card } from "@/components/ui";
import {
  listingDisplayNameForType,
  listingPublicPath,
} from "@/lib/listings/types";
import {
  formatBrl,
  formatNumber,
  vocationBadgeClass,
  cn,
} from "@/lib/utils";
import type { listings } from "@/lib/db/schema/listings";

type Listing = typeof listings.$inferSelect;

const LISTING_OUTFIT_SIZE = 96;

export function ListingCard({
  listing,
  whatsappPhone = "",
}: {
  listing: Listing;
  whatsappPhone?: string;
}) {
  const displayName = listingDisplayNameForType(listing);
  const href = listingPublicPath(listing.type, listing.slug);
  const priceBrl = formatBrl(listing.priceBrl);
  const priceCoins =
    listing.priceCoins != null && listing.priceCoins > 0
      ? formatNumber(listing.priceCoins)
      : null;

  if (listing.type === "items") {
    return (
      <ItemListingCard
        listing={listing}
        whatsappPhone={whatsappPhone}
        displayName={displayName}
        priceBrl={priceBrl}
        priceCoins={priceCoins}
      />
    );
  }

  const outfitUrl = listing.lookType
    ? buildOutfitImageUrl(
        listing.lookType,
        listing.lookAddons ?? 0,
        listing.lookHead ?? 0,
        listing.lookBody ?? 0,
        listing.lookLegs ?? 0,
        listing.lookFeet ?? 0,
      )
    : null;

  const snapshot = listing.snapshotData as Record<string, unknown> | null;
  const { skills, primaryKey } = getListingSkills(snapshot, listing.vocation);
  const levelPercent = getListingLevelPercent(snapshot, listing);
  const badges = getListingBadges(snapshot, listing).slice(0, 3);

  return (
    <Card className="group flex h-full flex-col overflow-hidden p-0 transition hover:border-[var(--color-primary)]/35 hover:shadow-lg hover:shadow-black/25">
      <Link href={href} className="flex min-h-0 flex-1 flex-col">
        <div className="relative border-b border-[var(--color-card-border)] bg-gradient-to-b from-[var(--color-accent)]/50 to-transparent px-4 pb-4 pt-4">
          {listing.featured && (
            <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-primary)]">
              <Sparkles className="h-3 w-3" />
              Destaque
            </span>
          )}

          <div className="flex gap-4">
            <div className="relative flex h-24 w-24 shrink-0 items-end justify-center overflow-hidden rounded-lg bg-gradient-to-b from-zinc-800/60 to-zinc-950/90 ring-1 ring-zinc-800/80">
              {outfitUrl ? (
                <OutfitSprite src={outfitUrl} alt="" size={LISTING_OUTFIT_SIZE} />
              ) : (
                <span className="pb-4 text-xs text-zinc-600">?</span>
              )}
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <h3 className="line-clamp-2 text-base font-semibold leading-snug text-zinc-100 group-hover:text-[var(--color-primary)]">
                {displayName}
              </h3>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium tabular-nums text-zinc-200">
                  Level {listing.level ?? "—"}
                  {levelPercent != null && (
                    <span className="font-normal text-zinc-500">
                      {" "}
                      · {levelPercent.toFixed(2)}%
                    </span>
                  )}
                </span>
                {listing.vocation && (
                  <Badge className={vocationBadgeClass(listing.vocation)}>
                    {listing.vocation}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <PriceStrip priceBrl={priceBrl} priceCoins={priceCoins} />

        <div className="grid grid-cols-2 gap-px border-b border-[var(--color-card-border)] bg-[var(--color-card-border)]">
          <MetaCell label="Mundo" value={listing.worldName ?? "—"} />
          <MetaCell
            label="Cosméticos"
            value={`${listing.outfitsCount ?? 0} outfits · ${listing.mountsCount ?? 0} mounts`}
          />
        </div>

        {skills.length > 0 && (
          <div className="border-b border-[var(--color-card-border)] px-4 py-3.5">
            <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
              Skills
            </p>
            <SkillGrid skills={skills} primaryKey={primaryKey} compact />
          </div>
        )}

        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-4 py-3">
            {badges.map((badge) => (
              <Badge
                key={badge.id}
                className="border border-zinc-800 bg-zinc-950/50 text-zinc-400"
              >
                {badge.label}
              </Badge>
            ))}
          </div>
        )}
      </Link>

      <div className="mt-auto border-t border-[var(--color-card-border)] bg-zinc-950/30 p-4">
        <ListingBuyButton
          whatsappPhone={whatsappPhone}
          slug={listing.slug}
          listingType={listing.type}
          displayName={displayName}
          level={listing.level}
          vocation={listing.vocation}
          worldName={listing.worldName}
        />
      </div>
    </Card>
  );
}

function PriceStrip({
  priceBrl,
  priceCoins,
}: {
  priceBrl: string | null;
  priceCoins: string | null;
}) {
  if (!priceBrl && !priceCoins) {
    return (
      <div className="border-b border-[var(--color-card-border)] px-4 py-3 text-sm text-zinc-500">
        Preço sob consulta
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 divide-x divide-[var(--color-card-border)] border-b border-[var(--color-card-border)] bg-zinc-950/40">
      <PriceCell label="Reais" value={priceBrl ?? "—"} tone="emerald" />
      <PriceCell label="Rubini Coins" value={priceCoins ?? "—"} tone="amber" />
    </div>
  );
}

function PriceCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "amber";
}) {
  return (
    <div className="px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 truncate text-lg font-bold tabular-nums leading-tight",
          tone === "emerald" ? "text-emerald-400" : "text-amber-400",
          value === "—" && "text-zinc-600",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--color-card)] px-4 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-600">
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-medium text-zinc-300">
        {value}
      </p>
    </div>
  );
}
