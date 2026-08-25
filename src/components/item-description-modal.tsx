"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";

export function ItemDescriptionModal({
  title,
  description,
  onClose,
}: {
  title: string;
  description: string;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="item-description-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(80vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[var(--color-card-border)] px-5 py-4">
          <h2 id="item-description-title" className="text-lg font-semibold">
            {title}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">Descrição do item</p>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
            {description}
          </p>
        </div>

        <div className="border-t border-[var(--color-card-border)] p-4">
          <Button type="button" variant="secondary" className="w-full" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
