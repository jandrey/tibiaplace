"use client";

import { useMemo, useState } from "react";
import {
  DetailsPager,
  DetailsSearch,
  EmptyState,
  PAGE_SIZE,
  pageSlice,
} from "@/components/character-details/ui";
import { resolveAchievements } from "@/lib/bazaar/achievements";
import { cn } from "@/lib/utils";

export function AchievementsPanel({
  achievements,
  themed = false,
}: {
  achievements: Array<{ id: number; unlockedAt?: number }>;
  themed?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const resolved = useMemo(
    () => resolveAchievements(achievements),
    [achievements],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return resolved;
    return resolved.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.gradeLabel.toLowerCase().includes(q),
    );
  }, [resolved, query]);

  const { rows, current, totalPages } = pageSlice(filtered, page, PAGE_SIZE);

  if (resolved.length === 0) {
    return <EmptyState label="Nenhuma conquista" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p
          className={cn(
            "text-sm",
            themed ? "text-[var(--cd-text)]" : "text-zinc-300",
          )}
        >
          Total de conquistas:{" "}
          <strong className={themed ? "text-[var(--cd-text)]" : "text-white"}>
            {resolved.length}
          </strong>
        </p>
        {themed ? (
          <DetailsSearch
            value={query}
            onChange={(v) => {
              setQuery(v);
              setPage(1);
            }}
            placeholder="Buscar..."
          />
        ) : (
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar..."
            className="h-9 w-full rounded-md border border-[var(--color-card-border)] bg-[var(--color-card)] px-3 text-sm outline-none placeholder:text-zinc-500 focus:border-[var(--color-primary)] sm:max-w-56"
          />
        )}
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr
            className={cn(
              "border-b text-left",
              themed
                ? "border-[var(--cd-line)] text-[var(--cd-muted)]"
                : "border-[var(--color-card-border)] text-zinc-400",
            )}
          >
            <th className="w-28 py-2.5 pr-4 font-medium">Grau</th>
            <th className="py-2.5 font-medium">Conquista</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={2}>
                <EmptyState label="Nenhuma conquista encontrada" />
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  "border-b last:border-0",
                  themed
                    ? "border-[var(--cd-line)]"
                    : "border-zinc-800/70",
                )}
              >
                <td className="py-2.5 pr-4 align-middle">
                  <GradeBadge grade={row.grade} label={row.gradeLabel} />
                </td>
                <td
                  className={cn(
                    "py-2.5 align-middle",
                    themed ? "text-[var(--cd-text)]" : "text-zinc-100",
                  )}
                >
                  {row.name}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {themed ? (
        <DetailsPager
          page={current}
          totalPages={totalPages}
          onChange={setPage}
        />
      ) : (
        totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              type="button"
              disabled={current <= 1}
              onClick={() => setPage(1)}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-card-border)] bg-[var(--color-accent)] text-sm disabled:opacity-40"
            >
              {"<<"}
            </button>
            <button
              type="button"
              disabled={current <= 1}
              onClick={() => setPage(current - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-card-border)] bg-[var(--color-accent)] text-sm disabled:opacity-40"
            >
              {"<"}
            </button>
            <span className="min-w-28 px-2 text-center text-sm text-zinc-400">
              Page {current} of {totalPages}
            </span>
            <button
              type="button"
              disabled={current >= totalPages}
              onClick={() => setPage(current + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-card-border)] bg-[var(--color-accent)] text-sm disabled:opacity-40"
            >
              {">"}
            </button>
            <button
              type="button"
              disabled={current >= totalPages}
              onClick={() => setPage(totalPages)}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-card-border)] bg-[var(--color-accent)] text-sm disabled:opacity-40"
            >
              {">>"}
            </button>
          </div>
        )
      )}
    </div>
  );
}

function GradeBadge({ grade, label }: { grade: number; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2.5 py-0.5 text-xs font-semibold",
        grade === 1 && "bg-zinc-500/25 text-zinc-700",
        grade === 2 && "bg-sky-300/50 text-sky-900",
        grade === 3 && "bg-violet-300/50 text-violet-900",
        grade === 4 && "bg-amber-300/50 text-amber-900",
        grade > 4 && "bg-zinc-500/25 text-zinc-700",
      )}
    >
      {label}
    </span>
  );
}
