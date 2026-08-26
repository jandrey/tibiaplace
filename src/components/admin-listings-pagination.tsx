import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminListingsPagination({
  current,
  totalPages,
  total,
  startIndex,
  pageSize,
  hrefForPage,
}: {
  current: number;
  totalPages: number;
  total: number;
  startIndex: number;
  pageSize: number;
  hrefForPage: (page: number) => string;
}) {
  if (total === 0) return null;

  const from = startIndex + 1;
  const to = Math.min(startIndex + pageSize, total);

  const btnClass = cn(
    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--color-card-border)] bg-[var(--color-surface)] text-zinc-300 transition",
    "hover:border-zinc-600 hover:text-white disabled:pointer-events-none disabled:opacity-35",
  );

  const pageNumbers = buildPageNumbers(current, totalPages);

  return (
    <div className="flex flex-col gap-3 border-t border-[var(--color-card-border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-center text-xs text-zinc-500 sm:text-left">
        Mostrando{" "}
        <span className="font-medium tabular-nums text-zinc-300">
          {from}–{to}
        </span>{" "}
        de{" "}
        <span className="font-medium tabular-nums text-zinc-300">{total}</span>
      </p>

      {totalPages > 1 && (
        <nav
          className="flex items-center justify-center gap-1"
          aria-label="Paginação de anúncios"
        >
          <Link
            href={hrefForPage(1)}
            aria-label="Primeira página"
            className={cn(btnClass, current <= 1 && "pointer-events-none opacity-35")}
            aria-disabled={current <= 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Link>
          <Link
            href={hrefForPage(current - 1)}
            aria-label="Página anterior"
            className={cn(btnClass, current <= 1 && "pointer-events-none opacity-35")}
            aria-disabled={current <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>

          <div className="hidden items-center gap-1 px-1 sm:flex">
            {pageNumbers.map((entry, i) =>
              entry === "ellipsis" ? (
                <span
                  key={`ellipsis-${i}`}
                  className="px-1 text-xs text-zinc-600"
                  aria-hidden
                >
                  …
                </span>
              ) : (
                <Link
                  key={entry}
                  href={hrefForPage(entry)}
                  aria-label={`Página ${entry}`}
                  aria-current={entry === current ? "page" : undefined}
                  className={cn(
                    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium tabular-nums transition",
                    entry === current
                      ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                      : "border border-[var(--color-card-border)] bg-[var(--color-surface)] text-zinc-300 hover:border-zinc-600 hover:text-white",
                  )}
                >
                  {entry}
                </Link>
              ),
            )}
          </div>

          <span className="inline-flex h-9 min-w-[4.5rem] items-center justify-center rounded-lg border border-[var(--color-card-border)] bg-[var(--color-accent)]/40 px-2 text-xs font-medium tabular-nums text-zinc-300 sm:hidden">
            {current} / {totalPages}
          </span>

          <Link
            href={hrefForPage(current + 1)}
            aria-label="Próxima página"
            className={cn(
              btnClass,
              current >= totalPages && "pointer-events-none opacity-35",
            )}
            aria-disabled={current >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
          <Link
            href={hrefForPage(totalPages)}
            aria-label="Última página"
            className={cn(
              btnClass,
              current >= totalPages && "pointer-events-none opacity-35",
            )}
            aria-disabled={current >= totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Link>
        </nav>
      )}
    </div>
  );
}

function buildPageNumbers(current: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: Array<number | "ellipsis"> = [1];

  if (current > 3) pages.push("ellipsis");

  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);

  for (let page = start; page <= end; page++) {
    pages.push(page);
  }

  if (current < totalPages - 2) pages.push("ellipsis");

  pages.push(totalPages);
  return pages;
}
