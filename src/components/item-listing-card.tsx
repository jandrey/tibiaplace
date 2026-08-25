"use client";

import { useState } from "react";
import { ItemDescriptionModal } from "@/components/item-description-modal";
import { ItemListingCardMenu } from "@/components/item-listing-card-menu";
import { ItemListingCardView } from "@/components/item-listing-card-view";
import { ListingBuyButton } from "@/components/listing-buy-button";
import { Card } from "@/components/ui";
import { parseItemTypeData } from "@/lib/listings/types";
import type { listings } from "@/lib/db/schema/listings";

type Listing = typeof listings.$inferSelect;

export function ItemListingCard({
  listing,
  whatsappPhone,
  displayName,
  priceBrl,
  priceCoins,
}: {
  listing: Listing;
  whatsappPhone: string;
  displayName: string;
  priceBrl: string | null;
  priceCoins: string | null;
}) {
  const [showDescription, setShowDescription] = useState(false);
  const item = parseItemTypeData(listing.typeData);
  const description = listing.description?.trim() ?? "";

  return (
    <>
      <Card className="relative flex h-full flex-col p-0">
        <ItemListingCardMenu
          slug={listing.slug}
          displayName={displayName}
          worldName={listing.worldName}
          description={listing.description}
          onShowDetails={() => setShowDescription(true)}
        />

        <ItemListingCardView
          item={item}
          displayName={displayName}
          worldName={listing.worldName}
          priceBrl={priceBrl}
          priceCoins={priceCoins}
          featured={listing.featured}
        />

        <div className="border-t border-[var(--color-card-border)] p-4">
          <ListingBuyButton
            whatsappPhone={whatsappPhone}
            slug={listing.slug}
            listingType={listing.type}
            displayName={displayName}
            worldName={listing.worldName}
          />
        </div>
      </Card>

      {showDescription && description && (
        <ItemDescriptionModal
          title={displayName}
          description={description}
          onClose={() => setShowDescription(false)}
        />
      )}
    </>
  );
}
