import { Package } from "lucide-react";
import { ItemSprite } from "@/components/item-sprite";
import type { ItemListingData } from "@/lib/listings/types";
import { cn } from "@/lib/utils";

export function ItemTierBadge({
  tier,
  className,
}: {
  tier: number;
  className?: string;
}) {
  if (tier <= 0) return null;

  return (
    <span
      className={cn(
        "absolute top-0 left-0 z-10 rounded-br-md rounded-tl-md bg-[var(--color-primary)] px-1.5 py-0.5 text-[10px] font-bold leading-none text-black shadow-sm",
        className,
      )}
    >
      T{tier}
    </span>
  );
}

export function ItemListingImage({
  item,
  size = 48,
  className,
  frameClassName,
  fitFrame = false,
}: {
  item: ItemListingData | null;
  size?: number;
  className?: string;
  frameClassName?: string;
  fitFrame?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-[var(--color-accent)]",
        fitFrame && "h-full w-full",
        frameClassName,
      )}
      style={fitFrame ? undefined : { width: size, height: size }}
    >
      {!item ? (
        <Package
          className="text-zinc-500"
          style={{ width: size * 0.45, height: size * 0.45 }}
        />
      ) : item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.imageUrl}
          alt={item.name}
          width={size}
          height={size}
          decoding="async"
          loading="lazy"
          draggable={false}
          className={cn(
            "h-full w-full object-contain p-1 [image-rendering:pixelated]",
            className,
          )}
        />
      ) : (
        <ItemSprite
          itemId={item.itemId}
          clientId={item.clientId}
          name={item.name}
          size={Math.round(size * 0.85)}
          className={className}
        />
      )}
      {item && <ItemTierBadge tier={item.tier} />}
    </div>
  );
}

export function normalizeItemImageUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("invalid");
    }
    return trimmed;
  } catch {
    throw new Error("Informe uma URL de imagem válida (http ou https).");
  }
}
