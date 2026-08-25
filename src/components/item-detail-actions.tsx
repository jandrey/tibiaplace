"use client";

import { useState } from "react";
import { ItemDescriptionModal } from "@/components/item-description-modal";
import { ListingBuyButton } from "@/components/listing-buy-button";
import { Badge, Button } from "@/components/ui";

export function ItemDetailActions({
  whatsappPhone,
  slug,
  displayName,
  worldName,
  description,
  status,
}: {
  whatsappPhone: string;
  slug: string;
  displayName: string;
  worldName?: string | null;
  description?: string | null;
  status: string;
}) {
  const [showDescription, setShowDescription] = useState(false);
  const trimmedDescription = description?.trim() ?? "";

  return (
    <>
      <div className="space-y-3 border-t border-[var(--color-card-border)] p-4">
        <Badge className="bg-[var(--color-accent)] text-zinc-300">
          {status === "available" ? "À venda" : "Vendido"}
        </Badge>

        {trimmedDescription && (
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => setShowDescription(true)}
          >
            Ver descrição
          </Button>
        )}

        {status === "available" && (
          <ListingBuyButton
            whatsappPhone={whatsappPhone}
            slug={slug}
            listingType="items"
            displayName={displayName}
            worldName={worldName}
          />
        )}
      </div>

      {showDescription && trimmedDescription && (
        <ItemDescriptionModal
          title={displayName}
          description={trimmedDescription}
          onClose={() => setShowDescription(false)}
        />
      )}
    </>
  );
}
