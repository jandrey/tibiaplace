export const ADMIN_LISTINGS_PAGE_SIZE = 10;

export function parseAdminListingsPage(value: string | undefined): number {
  const page = Number.parseInt(value ?? "1", 10);
  if (!Number.isFinite(page) || page < 1) return 1;
  return page;
}

export function paginateAdminListings<T>(
  items: T[],
  page: number,
  pageSize = ADMIN_LISTINGS_PAGE_SIZE,
) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  const startIndex = (current - 1) * pageSize;

  return {
    items: items.slice(startIndex, startIndex + pageSize),
    current,
    totalPages,
    total,
    startIndex,
    pageSize,
  };
}
