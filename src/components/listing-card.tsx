import Link from "next/link";
import { Sparkles } from "lucide-react";
import { buildCatalogOutfitImageUrl, buildOutfitImageUrl } from "@/lib/bazaar/types";
import { isCustomRubinotOutfit } from "@/lib/bazaar/custom-outfits";
import {
  getListingBadges,
  getListingLevelPercent,
  getListingSkills,
} from "@/lib/bazaar/snapshot";
import { ListingBuyButton } from "@/components/listing-buy-button";
import { ItemListingCard } from "@/components/item-listing-card";
import { OutfitSprite } from "@/components/outfit-sprite";
import { SkillBar, SkillGrid } from "@/components/skill-bar";
import { VocationTag } from "@/components/vocation-tag";
import { parseLevelSkill, type ParsedSkill } from "@/lib/bazaar/skills";
import { Badge, Card } from "@/components/ui";
import {
  listingDisplayNameForType,
  listingPublicPath,
} from "@/lib/listings/types";
import {
  formatBrl,
  formatNumber,
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
    ? isCustomRubinotOutfit(listing.lookType)
      ? buildCatalogOutfitImageUrl(
          listing.lookType,
          listing.lookAddons ?? 0,
          listing.lookHead ?? 0,
          listing.lookBody ?? 0,
          listing.lookLegs ?? 0,
          listing.lookFeet ?? 0,
        )
      : buildOutfitImageUrl(
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
  const levelSkill = parseLevelSkill(listing.level, levelPercent);
  const primarySkill = skills.find((skill) => skill.key === primaryKey) ?? skills[0];
  const badges = getListingBadges(snapshot, listing).slice(0, 3);
  const showSkillsSection = levelSkill != null || skills.length > 0;

  return (
    <Card className="group flex h-full flex-col overflow-hidden p-0 transition hover:border-[var(--color-primary)]/35 hover:shadow-lg hover:shadow-black/25">
      <Link href={href} className="flex min-h-0 flex-1 flex-col">
        <div className="relative border-b border-[var(--color-card-border)] bg-gradient-to-b from-[var(--color-accent)]/50 to-transparent px-4 pb-4 pt-4">
          {listing.featured && (
            <span className="absolute top-3 right-3 z-[1] inline-flex items-center gap-1 rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-primary)]">
              <Sparkles className="h-3 w-3" />
              Destaque
            </span>
          )}

          <div className="flex gap-4">
            <div className="relative shrink-0 pt-1">
              {listing.vocation && (
                <VocationTag
                  vocation={listing.vocation}
                  className="absolute -left-2 -top-1 z-10"
                />
              )}
              <div className="relative flex h-24 w-24 items-end justify-center overflow-hidden rounded-lg bg-gradient-to-b from-[var(--color-accent)] to-[var(--color-surface)] ring-1 ring-[var(--color-card-border)]">
                {outfitUrl ? (
                  <OutfitSprite src={outfitUrl} alt="" size={LISTING_OUTFIT_SIZE} />
                ) : (
                  <span className="pb-4 text-xs text-[var(--color-muted-foreground)]">?</span>
                )}
              </div>
            </div>

            <CharacterCardIdentity
              displayName={displayName}
              vocation={listing.vocation}
              level={listing.level}
              featured={listing.featured}
              primarySkill={primarySkill}
            />
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

        {showSkillsSection && (
          <div className="border-b border-[var(--color-card-border)] px-4 py-3.5">
            <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
              Skills
            </p>
            {levelSkill && (
              <div className="mb-3">
                <SkillBar skill={levelSkill} compact />
              </div>
            )}
            {skills.length > 0 && (
              <SkillGrid skills={skills} primaryKey={primaryKey} compact />
            )}
          </div>
        )}

        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-4 py-3">
            {badges.map((badge) => (
              <Badge
                key={badge.id}
                className="border border-[var(--color-card-border)] bg-[var(--color-surface)]/80 text-[var(--color-muted)]"
              >
                {badge.label}
              </Badge>
            ))}
          </div>
        )}
      </Link>

      <div className="mt-auto border-t border-[var(--color-card-border)] bg-[var(--color-surface)]/60 p-4">
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

function CharacterCardIdentity({
  displayName,
  vocation,
  level,
  featured,
  primarySkill,
}: {
  displayName: string;
  vocation?: string | null;
  level?: number | null;
  featured?: boolean | null;
  primarySkill?: ParsedSkill;
}) {
  return (
    <div
      className={cn(
        "flex min-h-24 min-w-0 flex-1 flex-col justify-center gap-2",
        featured && "pr-16",
      )}
    >
      <h3
        title={displayName}
        className="truncate text-base font-semibold leading-snug text-[var(--color-foreground)] group-hover:text-[var(--color-primary)]"
      >
        {displayName}
      </h3>

      {(vocation?.trim() || level != null) && (
        <p className="truncate text-xs leading-snug text-[var(--color-muted-foreground)]">
          {vocation?.trim() && (
            <span className="font-medium text-zinc-400">{vocation.trim()}</span>
          )}
          {vocation?.trim() && level != null && (
            <span aria-hidden className="text-zinc-600">
              {" "}
              ·{" "}
            </span>
          )}
          {level != null && (
            <span className="font-semibold tabular-nums text-[var(--color-primary)]">
              Lv {formatNumber(level)}
            </span>
          )}
        </p>
      )}

      {primarySkill && (
        <span className="inline-flex w-fit max-w-full items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5">
          <span className="truncate text-[10px] font-medium uppercase tracking-wide text-emerald-200/75">
            {primarySkill.shortLabel === "Magic" ? "Magic Level" : primarySkill.shortLabel}
          </span>
          <span className="shrink-0 text-xs font-bold tabular-nums text-emerald-100">
            {primarySkill.level}
          </span>
        </span>
      )}
    </div>
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
      <div className="border-b border-[var(--color-card-border)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
        Preço sob consulta
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 divide-x divide-[var(--color-card-border)] border-b border-[var(--color-card-border)] bg-[var(--color-surface)]/50">
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
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 truncate text-lg font-bold tabular-nums leading-tight",
          tone === "emerald" ? "text-[var(--color-hp)]" : "text-[var(--color-gold)]",
          value === "—" && "text-[var(--color-muted-foreground)]",
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
      <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-medium text-[var(--color-muted)]">
        {value}
      </p>
    </div>
  );
}
