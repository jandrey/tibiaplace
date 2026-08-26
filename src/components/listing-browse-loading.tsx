"use client";

import {
  Suspense,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  buildBrowseHref,
  listingTypeFromBrowsePath,
  parseListingSortFromHref,
  type ListingSort,
} from "@/lib/listings/sort";

type ListingBrowseLoadingContextValue = {
  isFiltering: boolean;
  pendingSort: ListingSort | null;
  filter: (href: string) => void;
};

const ListingBrowseLoadingContext =
  createContext<ListingBrowseLoadingContextValue | null>(null);

const FALLBACK_VALUE: ListingBrowseLoadingContextValue = {
  isFiltering: true,
  pendingSort: null,
  filter: () => {},
};

function normalizeBrowseHref(href: string) {
  if (href.startsWith("http://") || href.startsWith("https://")) {
    const url = new URL(href);
    return `${url.pathname}${url.search}`;
  }
  return href;
}

function currentBrowseHref(pathname: string, search: string) {
  return search ? `${pathname}?${search}` : pathname;
}

function ListingBrowseLoadingProviderInner({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const [isPending, startTransition] = useTransition();
  const [isNavigating, setIsNavigating] = useState(false);
  const [pendingSort, setPendingSort] = useState<ListingSort | null>(null);
  const targetHrefRef = useRef<string | null>(null);

  useEffect(() => {
    const current = currentBrowseHref(pathname, search);
    if (targetHrefRef.current === current) {
      targetHrefRef.current = null;
      setIsNavigating(false);
      setPendingSort(null);
    }
  }, [pathname, search]);

  useEffect(() => {
    if (!isNavigating) return;
    const timeout = window.setTimeout(() => {
      targetHrefRef.current = null;
      setIsNavigating(false);
      setPendingSort(null);
    }, 15000);
    return () => window.clearTimeout(timeout);
  }, [isNavigating]);

  function filter(href: string) {
    const target = normalizeBrowseHref(href);
    const current = currentBrowseHref(pathname, search);

    if (target === current) return;

    const browseType = listingTypeFromBrowsePath(pathname);
    if (browseType) {
      setPendingSort(parseListingSortFromHref(href, browseType));
    }

    targetHrefRef.current = target;
    setIsNavigating(true);
    startTransition(() => {
      router.push(href);
    });
  }

  const isFiltering = isPending || isNavigating;

  return (
    <ListingBrowseLoadingContext.Provider
      value={{ isFiltering, pendingSort, filter }}
    >
      {children}
    </ListingBrowseLoadingContext.Provider>
  );
}

export function ListingBrowseLoadingProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <ListingBrowseLoadingContext.Provider value={FALLBACK_VALUE}>
          {children}
        </ListingBrowseLoadingContext.Provider>
      }
    >
      <ListingBrowseLoadingProviderInner>
        {children}
      </ListingBrowseLoadingProviderInner>
    </Suspense>
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
  return buildBrowseHref(basePath, values);
}
