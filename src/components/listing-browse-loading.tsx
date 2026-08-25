"use client";

import {
  createContext,
  useContext,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

type ListingBrowseLoadingContextValue = {
  isFiltering: boolean;
  filter: (href: string) => void;
};

const ListingBrowseLoadingContext =
  createContext<ListingBrowseLoadingContextValue | null>(null);

export function ListingBrowseLoadingProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const [isFiltering, startTransition] = useTransition();

  function filter(href: string) {
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <ListingBrowseLoadingContext.Provider value={{ isFiltering, filter }}>
      {children}
    </ListingBrowseLoadingContext.Provider>
  );
}

export function useListingBrowseLoading() {
  const context = useContext(ListingBrowseLoadingContext);
  if (!context) {
    throw new Error(
      "useListingBrowseLoading must be used within ListingBrowseLoadingProvider",
    );
  }
  return context;
}

export function buildFilterHref(
  basePath: string,
  values: Record<string, string>,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    const trimmed = value.trim();
    if (trimmed) params.set(key, trimmed);
  }
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
