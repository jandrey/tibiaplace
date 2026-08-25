import { Globe, Star } from "lucide-react";
import { ItemListingImage } from "@/components/item-listing-image";
import { Badge } from "@/components/ui";
import type { ItemListingData } from "@/lib/listings/types";
import { cn } from "@/lib/utils";

export function ItemListingCardView({
  item,
  displayName,
  worldName,
  priceBrl,
  priceCoins,
  featured = false,
  interactive = false,
  className,
}: {
  item: ItemListingData | null;
  displayName: string;
  worldName?: string | null;
  priceBrl?: string | null;
  priceCoins?: string | null;
  featured?: boolean;
  interactive?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", interactive && "group", className)}>
      <div className="relative flex items-center justify-center border-b border-[var(--color-card-border)] bg-[var(--color-accent)]/60 px-6 py-8">
        {featured && (
          <Badge className="absolute top-3 left-3 gap-1 bg-[var(--color-primary)]/20 text-[var(--color-primary)]">
            <Star className="h-3 w-3 fill-current" />
            Destaque
          </Badge>
        )}
        <ItemListingImage
          item={item}
          size={112}
          frameClassName={cn(
            "h-28 w-28 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card)] shadow-sm",
            interactive && "transition group-hover:scale-105",
          )}
        />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3
          className={cn(
            "line-clamp-2 text-base font-semibold leading-snug",
            interactive && "group-hover:text-[var(--color-primary)]",
          )}
        >
          {displayName}
        </h3>
        {worldName && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-zinc-400">
            <Globe className="h-3.5 w-3.5 shrink-0" />
            {worldName}
          </p>
        )}

        {(priceBrl || priceCoins) && (
          <div className="mt-4 space-y-2 rounded-lg border border-[var(--color-card-border)] bg-[var(--color-accent)] p-3 text-sm">
            {priceBrl && (
              <div className="flex min-w-0 items-center justify-between gap-3">
                <span className="shrink-0 text-zinc-500">Reais</span>
                <span className="min-w-0 truncate font-semibold tabular-nums text-emerald-400">
                  {priceBrl}
                </span>
              </div>
            )}
            {priceCoins && (
              <div className="flex min-w-0 items-center justify-between gap-3">
                <span className="shrink-0 text-zinc-500">Coins</span>
                <span className="min-w-0 truncate font-semibold tabular-nums text-amber-400">
                  {priceCoins}
                </span>
              </div>
            )}
          </div>
        )}

        {!priceBrl && !priceCoins && (
          <p className="mt-4 text-sm text-zinc-500">Preço sob consulta</p>
        )}
      </div>
    </div>
  );
}
