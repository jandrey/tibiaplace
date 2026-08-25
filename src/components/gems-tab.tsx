"use client";

import { useState } from "react";
import { GemIcon, GemModCell } from "@/components/gem-sprite";
import {
  DetailsPager,
  EmptyState,
  pageSlice,
} from "@/components/character-details/ui";
import { cn } from "@/lib/utils";

export type GemEntry = {
  id: number;
  domain: number;
  type: number;
  locked: boolean;
  lesserBonusId?: number;
  regularBonusId?: number;
  supremeBonusId?: number;
};

const PAGE_SIZE = 15;
const GEM_SIZE = 32;
const MOD_SIZE = 30;
const SUPREME_SIZE = 35;

function GemRowCard({
  gem,
  vocationId,
}: {
  gem: GemEntry;
  vocationId: number;
}) {
  return (
    <article className="rounded-md border border-[var(--cd-border)] bg-[var(--cd-input)]/60 p-3">
      <div className="mb-3 flex items-center gap-3 border-b border-[var(--cd-line)] pb-3">
        <GemIcon
          domain={gem.domain}
          type={gem.type}
          vocationId={vocationId}
          size={GEM_SIZE}
        />
        <span className="text-xs font-medium tracking-wide text-[var(--cd-muted)] uppercase">
          Gem
        </span>
      </div>
      <div className="space-y-2.5">
        {([1, 2, 3] as const).map((slot) => (
          <div key={slot} className="flex gap-2">
            <span className="w-12 shrink-0 pt-1 text-[11px] font-medium text-[var(--cd-muted)]">
              Mod {slot}
            </span>
            <GemModCell
              gem={gem}
              slot={slot}
              modSize={MOD_SIZE}
              supremeSize={SUPREME_SIZE}
            />
          </div>
        ))}
      </div>
    </article>
  );
}

export function GemsTab({
  gems,
  vocationId = 0,
}: {
  gems: GemEntry[];
  vocationId?: number;
}) {
  const [page, setPage] = useState(1);
  const { rows, current, totalPages } = pageSlice(gems, page, PAGE_SIZE);

  if (gems.length === 0) return <EmptyState label="Nenhuma gem" />;

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-md border border-[var(--cd-border)] bg-[var(--cd-input)]/40">
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[720px] table-fixed text-sm">
          <colgroup>
            <col className="w-[4.5rem]" />
            <col />
            <col />
            <col />
          </colgroup>
          <thead>
            <tr className="border-b border-[var(--cd-border)] text-left text-[var(--cd-text)]">
              {(["Gem", "Mod 1", "Mod 2", "Mod 3"] as const).map((label, i) => (
                <th
                  key={label}
                  className={cn(
                    "bg-[var(--cd-input)]/70 px-3 py-2.5 text-[13px] font-semibold",
                    i === 0 ? "text-center" : "text-left",
                  )}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((gem) => (
              <tr
                key={gem.id}
                className="border-b border-[var(--cd-line)] last:border-b-0"
              >
                <td className="px-3 py-3 align-middle">
                  <div className="flex justify-center">
                    <GemIcon
                      domain={gem.domain}
                      type={gem.type}
                      vocationId={vocationId}
                      size={GEM_SIZE}
                    />
                  </div>
                </td>
                {([1, 2, 3] as const).map((slot) => (
                  <td key={slot} className="px-3 py-3 align-middle">
                    <GemModCell
                      gem={gem}
                      slot={slot}
                      modSize={MOD_SIZE}
                      supremeSize={SUPREME_SIZE}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-3 sm:hidden">
        {rows.map((gem) => (
          <GemRowCard key={gem.id} gem={gem} vocationId={vocationId} />
        ))}
      </div>

      <div className="border-t border-[var(--cd-border)] px-3 pb-3">
        <DetailsPager
          page={current}
          totalPages={totalPages}
          onChange={setPage}
        />
      </div>
    </div>
  );
}
