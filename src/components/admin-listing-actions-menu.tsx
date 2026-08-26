"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  EllipsisVertical,
  ExternalLink,
  Pencil,
  Star,
  X,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/components/toast-provider";
import {
  LISTING_STATUS_META,
  LISTING_STATUS_ORDER,
} from "@/lib/listings/status-meta";
import {
  LISTING_STATUS_COLORS,
  LISTING_STATUS_LABELS,
  cn,
} from "@/lib/utils";

type MenuPosition = {
  top: number;
  right: number;
};

export function AdminListingActionsMenu({
  listingId,
  status,
  featured,
  canViewPublic,
  publicPath,
  editPath,
}: {
  listingId: string;
  status: string;
  featured: boolean;
  canViewPublic: boolean;
  publicPath?: string;
  editPath: string;
}) {
  const menuId = useId();
  const router = useRouter();
  const toast = useToast();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const [isMobileSheet, setIsMobileSheet] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    function updateLayout() {
      const mobile = window.matchMedia("(max-width: 1023px)").matches;
      setIsMobileSheet(mobile);

      if (!mobile && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setMenuPosition({
          top: rect.bottom + 6,
          right: Math.max(12, window.innerWidth - rect.right),
        });
      } else {
        setMenuPosition(null);
      }
    }

    updateLayout();
    window.addEventListener("resize", updateLayout);
    window.addEventListener("scroll", updateLayout, true);

    return () => {
      window.removeEventListener("resize", updateLayout);
      window.removeEventListener("scroll", updateLayout, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);

    const lockScroll = window.matchMedia("(max-width: 1023px)").matches;
    if (lockScroll) document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    }

    const timer = window.setTimeout(() => {
      document.addEventListener("pointerdown", onPointerDown);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  async function patchListing(body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/listings/${listingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      throw new Error(data.error ?? "Erro ao atualizar");
    }
  }

  async function changeStatus(nextStatus: string) {
    if (nextStatus === status || pending) return;

    setPending(nextStatus);
    try {
      await patchListing({ status: nextStatus });
      toast.success(
        `Status: ${LISTING_STATUS_LABELS[nextStatus] ?? nextStatus}`,
      );
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar status",
      );
    } finally {
      setPending(null);
    }
  }

  async function toggleFeatured() {
    if (pending) return;

    setPending("featured");
    try {
      await patchListing({ featured: !featured });
      toast.success(featured ? "Destaque removido" : "Destaque ativado");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar destaque",
      );
    } finally {
      setPending(null);
    }
  }

  const statusPanel = (
    <div className="space-y-1">
      <p className="px-1 pb-1 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
        Alterar status
      </p>
      {LISTING_STATUS_ORDER.map((value) => {
        const meta = LISTING_STATUS_META[value];
        const Icon = meta.icon;
        const active = status === value;
        const loading = pending === value;

        return (
          <button
            key={value}
            type="button"
            disabled={Boolean(pending)}
            onClick={() => void changeStatus(value)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition",
              active
                ? "bg-[var(--color-primary)]/10 ring-1 ring-[var(--color-primary)]/30"
                : "hover:bg-[var(--color-accent)]",
              pending && !loading && "opacity-50",
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                LISTING_STATUS_COLORS[value],
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-zinc-100">
                {LISTING_STATUS_LABELS[value]}
              </span>
              <span className="block text-xs text-zinc-500">{meta.hint}</span>
            </span>
            {loading ? (
              <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-zinc-600 border-t-[var(--color-primary)]" />
            ) : (
              <span
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  active ? "bg-[var(--color-primary)]" : "bg-zinc-700",
                )}
                aria-hidden
              />
            )}
          </button>
        );
      })}
    </div>
  );

  const quickActions = (
    <div className="space-y-0.5 border-t border-[var(--color-card-border)] pt-2">
      <button
        type="button"
        disabled={Boolean(pending)}
        onClick={() => void toggleFeatured()}
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-zinc-200 transition hover:bg-[var(--color-accent)] disabled:opacity-50"
      >
        <Star
          className={cn(
            "h-4 w-4 shrink-0",
            featured ? "fill-amber-400 text-amber-400" : "text-zinc-400",
          )}
        />
        {featured ? "Remover destaque" : "Destacar na vitrine"}
      </button>

      {canViewPublic && publicPath && (
        <Link
          href={publicPath}
          onClick={() => setOpen(false)}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-zinc-200 transition hover:bg-[var(--color-accent)]"
        >
          <ExternalLink className="h-4 w-4 shrink-0 text-zinc-400" />
          Ver página pública
        </Link>
      )}

      <Link
        href={editPath}
        onClick={() => setOpen(false)}
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-zinc-200 transition hover:bg-[var(--color-accent)]"
      >
        <Pencil className="h-4 w-4 shrink-0 text-zinc-400" />
        Editar anúncio
      </Link>
    </div>
  );

  const portalContent =
    open && mounted ? (
      <>
        <div
          className={cn(
            "fixed inset-0 z-[100] bg-black/50 backdrop-blur-[1px]",
            isMobileSheet ? "block" : "hidden",
          )}
          onClick={() => setOpen(false)}
          aria-hidden
        />

        <div
          ref={panelRef}
          id={menuId}
          role="menu"
          aria-labelledby={`${menuId}-trigger`}
          className={cn(
            "z-[101] overflow-y-auto border border-[var(--color-card-border)] bg-[var(--color-card)] shadow-2xl",
            isMobileSheet
              ? "fixed inset-x-0 bottom-0 max-h-[min(85vh,520px)] rounded-t-2xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
              : "fixed w-72 rounded-xl p-2",
          )}
          style={
            !isMobileSheet && menuPosition
              ? {
                  top: menuPosition.top,
                  right: menuPosition.right,
                }
              : undefined
          }
        >
          {isMobileSheet && (
            <>
              <div className="relative mb-4 flex items-center justify-center">
                <div className="h-1 w-10 rounded-full bg-zinc-700" />
                <button
                  type="button"
                  aria-label="Fechar"
                  onClick={() => setOpen(false)}
                  className="absolute top-0 right-0 rounded-lg p-1.5 text-zinc-400 hover:bg-[var(--color-accent)] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mb-3 text-sm font-semibold text-zinc-100">
                Ações do anúncio
              </p>
            </>
          )}
          {statusPanel}
          {quickActions}
        </div>
      </>
    ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        id={`${menuId}-trigger`}
        type="button"
        aria-label="Ações do anúncio"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((value) => !value);
        }}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-zinc-400 transition",
          "hover:border-[var(--color-card-border)] hover:bg-[var(--color-accent)] hover:text-zinc-100",
          open && "border-[var(--color-card-border)] bg-[var(--color-accent)] text-zinc-100",
        )}
      >
        <EllipsisVertical className="h-4 w-4" />
      </button>

      {mounted && portalContent
        ? createPortal(portalContent, document.body)
        : null}
    </>
  );
}
