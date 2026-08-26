"use client";

import { type ReactNode } from "react";
import { ListingGridSkeleton } from "@/components/listing-grid-skeleton";
import { useListingBrowseLoading } from "@/components/listing-browse-loading";

export function ListingBrowseResults({
  listingType,
  children,
}: {
  listingType: "character" | "items";
  children: ReactNode;
}) {
  const { isFiltering } = useListingBrowseLoading();

  return (
    <div className="relative min-h-[320px]">
      {isFiltering ? (
        <ListingGridSkeleton listingType={listingType} />
      ) : (
        children
      )}
    </div>
  );
}
