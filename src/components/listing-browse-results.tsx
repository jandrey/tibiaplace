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

  if (isFiltering) {
    return <ListingGridSkeleton listingType={listingType} />;
  }

  return children;
}
