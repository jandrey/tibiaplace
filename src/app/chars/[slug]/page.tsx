export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { CharacterDetailsTabs } from "@/components/character-details-tabs";
import { OutfitSprite } from "@/components/outfit-sprite";
import { SkillGrid } from "@/components/skill-bar";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { SiteHeader } from "@/components/site-header";
import { Badge, Card } from "@/components/ui";
import { buildOutfitImageUrl } from "@/lib/bazaar/types";
import {
  getListingBadges,
  getListingLevelPercent,
  getListingSkills,
} from "@/lib/bazaar/snapshot";
import { requireAdminSession } from "@/lib/auth/session";
import { getListingBySlug } from "@/lib/queries/listings";
import {
  resolveCharacterName,
  shouldShowCharacterName,
} from "@/lib/listings/types";
import { EXTRA_PHOTOS_ENABLED } from "@/lib/listings/features";
import { formatBrl, formatNumber, vocationBadgeClass, cn } from "@/lib/utils";

export default async function CharPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [data, adminSession] = await Promise.all([
    getListingBySlug(slug, "character"),
    requireAdminSession(),
  ]);

  if (!data || data.listing.status === "archived") {
    notFound();
  }

  if (data.listing.type !== "character") {
    notFound();
  }

  const { listing, outfits, mounts, items, images } = data;
  const privacy = listing.privacyToggles;
  const isPublic = listing.status === "available";
  const visibleCharacterName = shouldShowCharacterName(privacy)
    ? resolveCharacterName(listing)
    : null;

  if (!isPublic && listing.status !== "sold") {
    notFound();
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
  const badges = getListingBadges(snapshot, listing);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/chars"
            className="text-sm text-[var(--color-muted)] hover:text-white"
          >
            ← Voltar
          </Link>
          {adminSession && (
            <Link
              href={`/admin/listings/${listing.id}`}
              className="rounded-md bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-black"
            >
              Editar personagem
            </Link>
          )}
        </div>

        <Card className="mt-6 overflow-hidden p-0">
          <div className="border-b border-[var(--color-card-border)]">
            {/* Identity */}
            <div className="px-5 pt-5 lg:px-6 lg:pt-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-xl font-semibold tracking-tight lg:text-2xl">
                    {listing.title}
                  </h1>
                  {visibleCharacterName && (
                    <p className="mt-1.5 text-sm text-[var(--color-muted)]">
                      {visibleCharacterName}
                    </p>
                  )}
                </div>
                <Badge
                  className={cn(
                    "shrink-0",
                    listing.status === "available"
                      ? "bg-[var(--color-success-muted)] text-[var(--color-success)] ring-1 ring-[var(--color-success)]/25"
                      : "bg-[var(--color-accent)] text-[var(--color-muted)] ring-1 ring-[var(--color-card-border)]",
                  )}
                >
                  {listing.status === "available" ? "À venda" : "Vendido"}
                </Badge>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-[var(--color-foreground)]">
                  Level {listing.level}
                  {levelPercent != null && (
                    <span className="text-[var(--color-muted-foreground)]">
                      {" "}
                      ({levelPercent.toFixed(2)}%)
                    </span>
                  )}
                </span>
                {listing.vocation && (
                  <>
                    <span className="text-[var(--color-card-border)]" aria-hidden>
                      ·
                    </span>
                    <Badge className={vocationBadgeClass(listing.vocation)}>
                      {listing.vocation}
                    </Badge>
                  </>
                )}
                {listing.worldName && (
                  <>
                    <span className="text-[var(--color-card-border)]" aria-hidden>
                      ·
                    </span>
                    <span className="text-[var(--color-muted)]">{listing.worldName}</span>
                  </>
                )}
              </div>
            </div>

            {/* Price + CTA */}
            <div className="mt-4 flex flex-col gap-4 border-t border-[var(--color-card-border)] bg-[var(--color-accent)]/25 px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
              <div className="flex flex-wrap gap-3">
                {listing.priceBrl && (
                  <div className="min-w-[140px] rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card)] px-4 py-2.5">
                    <p className="text-[10px] font-medium tracking-wider text-[var(--color-muted-foreground)] uppercase">
                      Reais
                    </p>
                    <p className="mt-0.5 text-lg font-bold tabular-nums text-[var(--color-hp)]">
                      {formatBrl(listing.priceBrl)}
                    </p>
                  </div>
                )}
                {listing.priceCoins != null && listing.priceCoins > 0 && (
                  <div className="min-w-[140px] rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card)] px-4 py-2.5">
                    <p className="text-[10px] font-medium tracking-wider text-[var(--color-muted-foreground)] uppercase">
                      Rubini Coins
                    </p>
                    <p className="mt-0.5 text-lg font-bold tabular-nums text-[var(--color-gold)]">
                      {formatNumber(listing.priceCoins)}
                    </p>
                  </div>
                )}
              </div>

              {listing.status === "available" && (
                <div className="w-full sm:w-auto sm:min-w-[200px]">
                  <WhatsAppButton
                    listingTitle={listing.title ?? "Personagem"}
                    listingSlug={listing.slug}
                  />
                </div>
              )}
            </div>

            {/* Highlights */}
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-1.5 border-t border-[var(--color-card-border)] px-5 py-3 lg:px-6">
                {badges.map((badge) => (
                  <Badge
                    key={badge.id}
                    className="border border-[var(--color-primary)]/20 bg-transparent text-[var(--color-primary)]"
                  >
                    {badge.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-[minmax(0,220px)_1fr]">
            <div className="flex items-center justify-center border-b border-[var(--color-card-border)] bg-[var(--color-accent)] px-3 py-5 lg:border-b-0 lg:border-r">
              {outfitUrl ? (
                <OutfitSprite
                  src={outfitUrl}
                  alt="Outfit"
                  size={180}
                  anchor="center"
                />
              ) : (
                <span className="py-6 text-sm text-zinc-500">Sem outfit</span>
              )}
            </div>

            {skills.length > 0 && (
              <div className="min-w-0 p-4 lg:p-5">
                <h2 className="mb-2.5 text-xs font-medium tracking-wide text-zinc-500 uppercase">
                  Skills
                </h2>
                <SkillGrid
                  skills={skills}
                  primaryKey={primaryKey}
                  variant="stacked"
                  maxColumns={2}
                  dense
                />
              </div>
            )}
          </div>
        </Card>

        <div className="mt-6 min-w-0 space-y-6">
          {listing.description && (
              <Card>
                <h2 className="mb-2 text-lg font-semibold">Descrição</h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                  {listing.description}
                </p>
              </Card>
            )}

            <CharacterDetailsTabs
              outfits={outfits}
              mounts={mounts}
              items={items}
              snapshot={snapshot}
              vocation={listing.vocation}
            />

            {EXTRA_PHOTOS_ENABLED && images.length > 0 && (
              <Card>
                <h2 className="mb-3 text-lg font-semibold">Fotos extras</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {images.map((image) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={image.id}
                      src={image.url}
                      alt="Screenshot"
                      className="rounded-md border border-[var(--color-card-border)]"
                    />
                  ))}
                </div>
              </Card>
            )}
        </div>
      </main>
    </div>
  );
}
