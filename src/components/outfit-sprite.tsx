"use client";

import { queuedImageProbe } from "@/lib/image-load-queue";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";

/** Successful loads stay forever; failures are not sticky. */
const okUrlCache = new Set<string>();

/** Prefetch / warm cache — uses site-wide image queue. */
export function preloadOutfitUrl(url: string): Promise<"ok" | "fail"> {
  if (okUrlCache.has(url)) return Promise.resolve("ok");
  return queuedImageProbe(url).then((status) => {
    if (status === "ok") okUrlCache.add(url);
    return status;
  });
}

export function isOutfitUrlCached(url: string) {
  return okUrlCache.has(url);
}

type OutfitSpriteProps = {
  src: string;
  /** Tried when `src` fails (e.g. proxy / base without addons). */
  fallbackSrc?: string | null;
  /** Extra fallbacks after fallbackSrc (tried in order). */
  fallbackSrcs?: string[];
  alt?: string;
  size?: number;
  /** Vertical anchor inside the sprite box (default: bottom, like standing on ground). */
  anchor?: "bottom" | "center";
  className?: string;
  static?: boolean;
  lazy?: boolean;
};

type DisplayMode = "gif" | "sheet";

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

  const knownIndex = candidates.findIndex((u) => okUrlCache.has(u));
  const [inView, setInView] = useState(!lazy || knownIndex >= 0);
  const [index, setIndex] = useState(Math.max(0, knownIndex));
  const [failed, setFailed] = useState(false);
  const [mode, setMode] = useState<DisplayMode>("sheet");
  const [frames, setFrames] = useState(8);

  useEffect(() => {
    const nextIndex = candidates.findIndex((u) => okUrlCache.has(u));
    setIndex(nextIndex >= 0 ? nextIndex : 0);
    setFailed(false);
    setMode("sheet");
    if (nextIndex >= 0) setInView(true);
  }, [candidatesKey]);

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
      setMode("sheet");
      return;
    }
    setFailed(true);
  }

  function handleImgLoad(img: HTMLImageElement) {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (w < 8 || h < 8) {
      advanceCandidate();
      return;
    }
    if (activeSrc) okUrlCache.add(activeSrc);
    if (w >= h * 2) {
      setFrames(Math.max(2, Math.round(w / h)));
      setMode("sheet");
      return;
    }
    setMode("gif");
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
            !isStatic && "animate-outfit-walk",
          )}
          style={{
            width: size,
            height: size,
            backgroundImage: `url(${activeSrc})`,
            backgroundSize: `${size * frames}px ${size}px`,
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
            mode === "sheet"
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
