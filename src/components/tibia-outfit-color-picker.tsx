"use client";

import { useState } from "react";
import {
  clampOutfitColorId,
  OUTFIT_COLOR_COUNT,
  OUTFIT_COLOR_GRID,
  OUTFIT_COLOR_PARTS,
  outfitColorToCss,
  type OutfitColorPart,
} from "@/lib/bazaar/outfit-colors";
import { cn } from "@/lib/utils";

export function TibiaOutfitColorPicker({
  head,
  body,
  legs,
  feet,
  onChange,
}: {
  head: number;
  body: number;
  legs: number;
  feet: number;
  onChange: (part: OutfitColorPart, colorId: number) => void;
}) {
  const [activePart, setActivePart] = useState<OutfitColorPart>("head");

  const values: Record<OutfitColorPart, number> = {
    head: clampOutfitColorId(head),
    body: clampOutfitColorId(body),
    legs: clampOutfitColorId(legs),
    feet: clampOutfitColorId(feet),
  };

  const activeColorId = values[activePart];
  const activeLabel =
    OUTFIT_COLOR_PARTS.find((part) => part.id === activePart)?.label ?? "Head";

  return (
    <div className="space-y-0">
      <div className="flex border border-[var(--color-primary)]/35">
        {OUTFIT_COLOR_PARTS.map((part) => {
          const selected = activePart === part.id;
          return (
            <button
              key={part.id}
              type="button"
              onClick={() => setActivePart(part.id)}
              className={cn(
                "min-w-0 flex-1 border-r border-[var(--color-primary)]/35 px-2 py-2.5 text-sm font-semibold transition last:border-r-0 sm:px-3",
                selected
                  ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] ring-1 ring-inset ring-[var(--color-primary)]/50"
                  : "bg-[var(--color-accent)]/30 text-zinc-500 hover:bg-[var(--color-accent)]/50 hover:text-zinc-300",
              )}
            >
              {part.label}
            </button>
          );
        })}
      </div>

      <div className="border border-t-0 border-[var(--color-primary)]/35 bg-[var(--color-accent)]/40 p-3">
        <p className="mb-2 text-xs text-zinc-500">Paleta Tibia · {activeLabel}</p>

        <div
          className="grid gap-0.5"
          style={{
            gridTemplateColumns: `repeat(${OUTFIT_COLOR_GRID.columns}, minmax(0, 1fr))`,
          }}
          role="listbox"
          aria-label={`Cor ${activeLabel}`}
        >
          {Array.from({ length: OUTFIT_COLOR_COUNT }, (_, colorId) => {
            const selected = activeColorId === colorId;
            return (
              <button
                key={colorId}
                type="button"
                role="option"
                aria-selected={selected}
                title={`Cor ${colorId}`}
                onClick={() => onChange(activePart, colorId)}
                className={cn(
                  "aspect-square min-h-4 w-full rounded-[2px] border transition",
                  selected
                    ? "z-10 scale-110 border-white ring-2 ring-[var(--color-primary)] ring-offset-1 ring-offset-zinc-900"
                    : "border-black/20 hover:scale-105 hover:border-white/40",
                )}
                style={{ backgroundColor: outfitColorToCss(colorId) }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
