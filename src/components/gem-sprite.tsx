"use client";

import {
  basicModSpriteStyle,
  formatGemModDisplayLabel,
  gemLabel,
  gemModForSlot,
  gemModLabel,
  gemSpriteStyle,
  type GemRow,
  supremeModSpriteStyle,
} from "@/lib/bazaar/gems";
import { cn } from "@/lib/utils";

export function GemIcon({
  domain,
  type,
  vocationId = 0,
  size = 32,
  className,
}: {
  domain: number;
  type: number;
  vocationId?: number;
  size?: number;
  className?: string;
}) {
  return (
    <span
      title={gemLabel(domain, type)}
      className={cn("inline-block shrink-0", className)}
      style={gemSpriteStyle(domain, type, vocationId, size)}
    />
  );
}

export function GemModIcon({
  gem,
  slot,
  className,
  modSize,
  supremeSize,
}: {
  gem: GemRow;
  slot: 1 | 2 | 3;
  className?: string;
  modSize?: number;
  supremeSize?: number;
}) {
  const modId = gemModForSlot(gem, slot);
  const label = gemModLabel(gem, slot);

  if (modId == null) {
    return <span className="text-[var(--cd-muted)]">—</span>;
  }

  const style =
    slot === 3
      ? supremeModSpriteStyle(modId, supremeSize)
      : basicModSpriteStyle(modId, modSize);

  return (
    <div className={cn("flex min-w-0 items-center gap-1.5", className)}>
      <span
        title={label}
        className="inline-block shrink-0"
        style={style}
      />
      <span className="truncate text-xs text-[var(--cd-text)]">{label}</span>
    </div>
  );
}

export function GemModCell({
  gem,
  slot,
  modSize = 30,
  supremeSize = 35,
  variant = "default",
}: {
  gem: GemRow;
  slot: 1 | 2 | 3;
  modSize?: number;
  supremeSize?: number;
  variant?: "default" | "bazaar";
}) {
  const modId = gemModForSlot(gem, slot);
  const rawLabel = gemModLabel(gem, slot);

  if (modId == null) {
    return (
      <span
        className={cn(
          variant === "bazaar" ? "text-[#9a8870]" : "text-[var(--cd-muted)]",
        )}
      >
        —
      </span>
    );
  }

  const label =
    variant === "bazaar"
      ? formatGemModDisplayLabel(rawLabel, slot)
      : rawLabel;

  const style =
    slot === 3
      ? supremeModSpriteStyle(modId, supremeSize)
      : basicModSpriteStyle(modId, modSize);

  const isBazaar = variant === "bazaar";

  return (
    <div
      className={cn(
        "flex min-w-0 items-start gap-2.5",
        isBazaar && "gap-2.5",
      )}
      title={rawLabel}
    >
      <span
        className={cn("inline-block shrink-0", isBazaar && "mt-0.5")}
        style={style}
        aria-hidden
      />
      <span
        className={cn(
          "min-w-0 leading-snug break-words",
          isBazaar
            ? "text-[13px] text-[#2a241c]"
            : "truncate text-xs text-[var(--cd-text)]",
        )}
      >
        {label}
      </span>
    </div>
  );
}
