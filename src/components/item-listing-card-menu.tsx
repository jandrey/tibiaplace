"use client";

import { EllipsisVertical, FileText, Link2, Share2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { listingPublicPath } from "@/lib/listings/types";
import { cn } from "@/lib/utils";

function MenuItem({
  icon: Icon,
  label,
  hint,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-zinc-200 transition-colors hover:bg-[var(--color-accent)]"
    >
      <Icon className="h-4 w-4 shrink-0 text-zinc-400" />
      <span className="min-w-0 flex-1">
        <span className="block">{label}</span>
        {hint && <span className="block text-xs text-zinc-500">{hint}</span>}
      </span>
    </button>
  );
}

export function ItemListingCardMenu({
  slug,
  displayName,
  worldName,
  description,
  onShowDetails,
  className,
}: {
  slug: string;
  displayName: string;
  worldName?: string | null;
  description?: string | null;
  onShowDetails: () => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copyHint, setCopyHint] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const hasDescription = Boolean(description?.trim());
  const listingUrl = useMemo(() => {
    const path = listingPublicPath("items", slug);
    if (typeof window === "undefined") return path;
    return `${window.location.origin}${path}`;
  }, [slug]);

  const shareText = useMemo(() => {
    const server = worldName ? ` (${worldName})` : "";
    return `Confira ${displayName}${server} no TibiaPlace`;
  }, [displayName, worldName]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (!copyHint) return;
    const timer = window.setTimeout(() => setCopyHint(null), 2000);
    return () => window.clearTimeout(timer);
  }, [copyHint]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(listingUrl);
      setCopyHint("Copiado!");
    } catch {
      setCopyHint("Erro ao copiar");
    }

    window.setTimeout(() => {
      setCopyHint(null);
      setOpen(false);
    }, 1200);
  }

  async function shareListing() {
    const payload = {
      title: displayName,
      text: shareText,
      url: listingUrl,
    };

    if (typeof navigator.share === "function") {
      try {
        await navigator.share(payload);
        setOpen(false);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${listingUrl}`)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={cn("absolute top-2 right-2 z-20", className)}>
      <button
        type="button"
        aria-label="Mais opções"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-black/20 hover:text-zinc-200"
      >
        <EllipsisVertical className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 w-48 overflow-hidden rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card)] py-1 shadow-xl"
        >
          {hasDescription && (
            <MenuItem
              icon={FileText}
              label="Detalhes"
              onClick={() => {
                setOpen(false);
                onShowDetails();
              }}
            />
          )}
          <MenuItem
            icon={Link2}
            label="Copiar link"
            hint={copyHint ?? undefined}
            onClick={() => void copyLink()}
          />
          <MenuItem
            icon={Share2}
            label="Compartilhar"
            onClick={() => void shareListing()}
          />
        </div>
      )}
    </div>
  );
}
