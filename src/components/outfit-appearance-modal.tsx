"use client";

import { useEffect } from "react";
import { OutfitSprite } from "@/components/outfit-sprite";
import { TibiaOutfitColorPicker } from "@/components/tibia-outfit-color-picker";
import { Button } from "@/components/ui";
import type { OutfitColorPart } from "@/lib/bazaar/outfit-colors";

export function OutfitAppearanceModal({
  open,
  onClose,
  outfit,
  head,
  body,
  legs,
  feet,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  outfit: {
    src: string;
    fallback: string;
    name: string;
    addons: number;
  } | null;
  head: number;
  body: number;
  legs: number;
  feet: number;
  onChange: (part: OutfitColorPart, colorId: number) => void;
}) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="outfit-appearance-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(92vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[var(--color-card-border)] px-5 py-4">
          <h2 id="outfit-appearance-title" className="text-lg font-semibold">
            Cores do outfit
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Ajuste cabeça, corpo, pernas e pés com a paleta do Tibia.
          </p>
        </div>

        <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto p-5 sm:grid-cols-[180px_minmax(0,1fr)]">
          <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--color-card-border)] bg-[var(--color-accent)]/40 px-4 py-6">
            {outfit ? (
              <>
                <OutfitSprite
                  src={outfit.src}
                  fallbackSrc={outfit.fallback}
                  alt={outfit.name}
                  size={128}
                />
                <p className="mt-4 text-center text-sm font-medium text-zinc-100">
                  {outfit.name}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Addons: {outfit.addons}
                </p>
              </>
            ) : (
              <p className="py-10 text-center text-sm text-zinc-500">
                Selecione um outfit principal
              </p>
            )}
          </div>

          <TibiaOutfitColorPicker
            head={head}
            body={body}
            legs={legs}
            feet={feet}
            onChange={onChange}
          />
        </div>

        <div className="border-t border-[var(--color-card-border)] p-4">
          <Button type="button" className="w-full sm:ml-auto sm:w-auto" onClick={onClose}>
            Concluído
          </Button>
        </div>
      </div>
    </div>
  );
}
