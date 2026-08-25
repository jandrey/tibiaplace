"use client";

import {
  analyzeOutfitImage,
  type OutfitImageLayout,
} from "@/lib/sprites/image-validation";
import { queuedImageProbe } from "@/lib/image-load-queue";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";

/** Validated layout per URL — avoids re-probing and bad preload cache. */
const layoutCache = new Map<string, OutfitImageLayout>();

function cacheLayout(url: string, layout: OutfitImageLayout) {
  layoutCache.set(url, layout);
}

export function isOutfitUrlCached(url: string) {
  return layoutCache.has(url);
}

/** Prefetch through the global queue; only caches URLs with valid dimensions. */
export function preloadOutfitUrl(url: string): Promise<"ok" | "fail"> {
  if (layoutCache.has(url)) return Promise.resolve("ok");

  return queuedImageProbe(url, (img) => {
    const layout = analyzeOutfitImage(img.naturalWidth, img.naturalHeight);
    if (!layout) return "fail";
    cacheLayout(url, layout);
    return "ok";
  });
}

type OutfitSpriteProps = {
  src: string;
  fallbackSrc?: string | null;
  fallbackSrcs?: string[];
  alt?: string;
  size?: number;
  anchor?: "bottom" | "center";
  className?: string;
  static?: boolean;
  lazy?: boolean;
};

type DisplayMode = "gif" | "sheet" | "loading";

/**
 * HD RubinOT walk sheets (preferred) or animated GIFs.
 * Renders immediately and advances through fallbacks on load/error.
 */
export function OutfitSprite({
  src,
  fallbackSrc = null,
  fallbackSrcs = [],
  alt = "",
  size = 64,
  anchor = "bottom",
  className,
  static: isStatic = false,
  lazy = true,
}: OutfitSpriteProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const candidates = useMemo(
    () =>
      [src, fallbackSrc, ...fallbackSrcs].filter(
        (u, i, arr): u is string => Boolean(u) && arr.indexOf(u) === i,
      ),
    [src, fallbackSrc, fallbackSrcs],
  );
  const candidatesKey = candidates.join("|");

  const cachedIndex = candidates.findIndex((u) => layoutCache.has(u));
  const cachedLayout =
    cachedIndex >= 0 ? layoutCache.get(candidates[cachedIndex]!) : undefined;

  const [inView, setInView] = useState(!lazy || cachedIndex >= 0);
  const [index, setIndex] = useState(Math.max(0, cachedIndex));
  const [failed, setFailed] = useState(false);
  const [mode, setMode] = useState<DisplayMode>(
    cachedLayout?.mode ?? "loading",
  );
  const [frames, setFrames] = useState(cachedLayout?.frames ?? 8);

  useEffect(() => {
    const nextIndex = candidates.findIndex((u) => layoutCache.has(u));
    const layout = nextIndex >= 0 ? layoutCache.get(candidates[nextIndex]!) : undefined;
    setIndex(nextIndex >= 0 ? nextIndex : 0);
    setFailed(false);
    setMode(layout?.mode ?? "loading");
    setFrames(layout?.frames ?? 8);
    if (nextIndex >= 0) setInView(true);
  }, [candidatesKey, candidates]);

  useEffect(() => {
    if (!lazy || inView) return;
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px 0px", threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [lazy, inView, candidatesKey]);

  const activeSrc =
    inView && !failed ? (candidates[index] ?? null) : null;

  function advanceCandidate() {
    const next = index + 1;
    if (next < candidates.length) {
      setIndex(next);
      setMode("loading");
      return;
    }
    setFailed(true);
  }

  function handleImgLoad(img: HTMLImageElement) {
    const layout = analyzeOutfitImage(img.naturalWidth, img.naturalHeight);
    if (!layout) {
      advanceCandidate();
      return;
    }
    if (activeSrc) cacheLayout(activeSrc, layout);
    setMode(layout.mode);
    setFrames(layout.frames);
  }

  return (
    <div
      ref={rootRef}
      title={alt}
      role="img"
      aria-label={alt}
      className={cn(
        "relative flex shrink-0 justify-center overflow-hidden",
        anchor === "center" ? "items-center" : "items-end",
        !activeSrc && !failed && "animate-pulse rounded bg-black/10",
        failed && "rounded bg-black/5",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {activeSrc && mode === "sheet" ? (
        <div
          className={cn(
            "bg-no-repeat [image-rendering:pixelated]",
            anchor === "center" ? "bg-[left_center]" : "bg-left-bottom",
          )}
          style={{
            width: size,
            height: size,
            backgroundImage: `url(${activeSrc})`,
            backgroundSize: `${size * frames}px ${size}px`,
            animation: isStatic
              ? undefined
              : `outfit-walk 0.8s steps(${frames}) infinite`,
            // @ts-expect-error CSS custom property for walk keyframes
            "--outfit-sheet-width": `${size * frames}px`,
          }}
        />
      ) : null}

      {activeSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={activeSrc}
          src={activeSrc}
          alt={alt}
          width={size}
          height={size}
          decoding="async"
          draggable={false}
          onLoad={(e) => handleImgLoad(e.currentTarget)}
          onError={advanceCandidate}
          className={cn(
            mode === "sheet" || mode === "loading"
              ? "pointer-events-none absolute opacity-0"
              : cn(
                  "max-h-full max-w-full object-contain [image-rendering:pixelated]",
                  anchor === "center" ? "object-center" : "object-bottom",
                ),
          )}
        />
      ) : null}
    </div>
  );
}
