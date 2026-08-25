"use client";

import { Pencil } from "lucide-react";
import { OutfitSprite } from "@/components/outfit-sprite";
import { cn } from "@/lib/utils";

export function PrimaryOutfitPreviewCard({
  outfit,
  onEdit,
  compact = false,
  className,
}: {
  outfit: {
    src: string;
    fallback: string;
    name: string;
    addons: number;
  } | null;
  onEdit?: () => void;
  compact?: boolean;
  className?: string;
}) {
  const spriteSize = compact ? 96 : 112;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center rounded-xl border border-[var(--color-card-border)] bg-[var(--color-accent)]/40 px-4 py-5",
        className,
      )}
    >
      {onEdit && outfit && (
        <button
          type="button"
          onClick={onEdit}
          className="absolute top-2.5 right-2.5 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card)]/90 text-zinc-400 transition hover:border-zinc-600 hover:text-white"
          aria-label="Editar cores do outfit"
          title="Editar cores"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}

      {outfit ? (
        <>
          <OutfitSprite
            src={outfit.src}
            fallbackSrc={outfit.fallback}
            alt={outfit.name}
            size={spriteSize}
          />
          <p className="mt-3 max-w-[200px] text-center text-sm font-medium text-zinc-100">
            {outfit.name}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Addons: {outfit.addons}</p>
        </>
      ) : (
        <p className="py-8 text-center text-sm text-zinc-500">
          Selecione um outfit abaixo para definir a aparência principal
        </p>
      )}
    </div>
  );
}
