import Link from "next/link";
import { notFound } from "next/navigation";
import { ItemDetailActions } from "@/components/item-detail-actions";
import { ItemListingCardView } from "@/components/item-listing-card-view";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui";
import { getListingBySlug } from "@/lib/queries/listings";
import { getWhatsAppNumber } from "@/lib/settings";
import { EXTRA_PHOTOS_ENABLED } from "@/lib/listings/features";
import {
  listingDisplayNameForType,
  parseItemTypeData,
} from "@/lib/listings/types";
import { formatBrl, formatNumber } from "@/lib/utils";

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [data, whatsappPhone] = await Promise.all([
    getListingBySlug(slug, "items"),
    getWhatsAppNumber(),
  ]);

  if (!data || data.listing.status === "archived") notFound();
  if (data.listing.status !== "available" && data.listing.status !== "sold") {
    notFound();
  }

  const { listing, images } = data;
  const item = parseItemTypeData(listing.typeData);
  const title = listingDisplayNameForType(listing);
  const priceBrl = formatBrl(listing.priceBrl);
  const priceCoins =
    listing.priceCoins != null && listing.priceCoins > 0
      ? formatNumber(listing.priceCoins)
      : null;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-8">
        <Link href="/items" className="text-sm text-zinc-500 hover:text-white">
          ← Voltar para itens
        </Link>

        <Card className="mt-6 overflow-hidden p-0">
          <ItemListingCardView
            item={item}
            displayName={title}
            worldName={listing.worldName}
            priceBrl={priceBrl}
            priceCoins={priceCoins}
            featured={listing.featured}
          />

          <ItemDetailActions
            whatsappPhone={whatsappPhone}
            slug={listing.slug}
            displayName={title}
            worldName={listing.worldName}
            description={listing.description}
            status={listing.status}
          />
        </Card>

        {EXTRA_PHOTOS_ENABLED && images.length > 0 && (
          <Card className="mt-4 p-4">
            <h2 className="mb-3 font-semibold">Fotos extras</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {images.map((image) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={image.id}
                  src={image.url}
                  alt=""
                  className="rounded-lg border border-[var(--color-card-border)]"
                />
              ))}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
