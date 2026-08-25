"use client";

import { itemImageCandidates } from "@/lib/bazaar/items";
import { queuedImageProbe } from "@/lib/image-load-queue";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** Warm across pagination / tab switches — browser keeps decoded images too. */
const resolvedCache = new Map<string, string>();

function cacheKey(
  itemId?: number | null,
  clientId?: number | null,
  name?: string,
) {
  return `${itemId ?? 0}:${clientId ?? 0}:${name ?? ""}`;
}

type ItemSpriteProps = {
  itemId?: number | null;
  clientId?: number | null;
  name: string;
  size?: number;
  className?: string;
};

/**
 * Item sprite with global URL cache and queued image probing.
 * Only the current viewport page should mount many at once — queue caps concurrency.
 */
export function ItemSprite({
  itemId,
  clientId,
  name,
  size = 32,
  className,
}: ItemSpriteProps) {
  const key = cacheKey(itemId, clientId, name);
  const candidates = useMemo(
    () => itemImageCandidates(itemId, clientId, name),
    [itemId, clientId, name],
  );

  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [displaySrc, setDisplaySrc] = useState<string | null>(
    () => resolvedCache.get(key) ?? null,
  );
  const [failed, setFailed] = useState(candidates.length === 0);

  useEffect(() => {
    const hit = resolvedCache.get(key);
    if (hit) {
      setDisplaySrc(hit);
      setFailed(false);
      return;
    }
    setDisplaySrc(null);
    setFailed(candidates.length === 0);
  }, [key, candidates]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setVisible(true);
      },
      { rootMargin: "80px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || displaySrc || failed || candidates.length === 0) return;

    let cancelled = false;

    (async () => {
      for (const url of candidates) {
        if (cancelled) return;
        const status = await queuedImageProbe(url);
        if (cancelled) return;
        if (status === "ok") {
          resolvedCache.set(key, url);
          setDisplaySrc(url);
          setFailed(false);
          return;
        }
      }
      if (!cancelled) setFailed(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [visible, displaySrc, failed, candidates, key]);

  const onError = useCallback(() => {
    setDisplaySrc(null);
    setFailed(true);
  }, []);

  return (
    <div
      ref={rootRef}
      title={name}
      className={cn(
        "flex items-center justify-center",
        !displaySrc && !failed && "animate-pulse rounded bg-black/10",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {displaySrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={displaySrc}
          src={displaySrc}
          alt={name}
          width={size}
          height={size}
          decoding="async"
          loading="lazy"
          draggable={false}
          onError={onError}
          className="max-h-full max-w-full object-contain [image-rendering:pixelated]"
        />
      ) : failed ? (
        <span className="line-clamp-3 px-0.5 text-center text-[9px] leading-tight text-[var(--cd-text)]">
          {name}
        </span>
      ) : null}
    </div>
  );
}
