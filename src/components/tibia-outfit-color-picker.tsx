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

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {OUTFIT_COLOR_PARTS.map((part) => {
          const colorId = values[part.id];
          const selected = activePart === part.id;
          return (
            <button
              key={part.id}
              type="button"
              onClick={() => setActivePart(part.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition",
                selected
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-white"
                  : "border-[var(--color-card-border)] bg-[var(--color-accent)]/50 text-zinc-300 hover:border-zinc-600",
              )}
            >
              <span
                className="h-5 w-5 shrink-0 rounded border border-black/30 shadow-inner"
                style={{ backgroundColor: outfitColorToCss(colorId) }}
                aria-hidden
              />
              <span className="font-medium">{part.label}</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-accent)]/40 p-3">
        <p className="mb-2 text-xs text-zinc-500">
          Paleta Tibia ·{" "}
          {OUTFIT_COLOR_PARTS.find((part) => part.id === activePart)?.label}
        </p>

        <div
          className="grid gap-0.5"
          style={{
            gridTemplateColumns: `repeat(${OUTFIT_COLOR_GRID.columns}, minmax(0, 1fr))`,
          }}
          role="listbox"
          aria-label={`Cor da ${OUTFIT_COLOR_PARTS.find((part) => part.id === activePart)?.label}`}
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
