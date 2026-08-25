"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Input, Label, Textarea } from "@/components/ui";
import { buildInterestMessage, getWhatsAppUrl } from "@/lib/utils";
import {
  LISTING_TYPE_LABELS,
  listingPublicPath,
  type ListingType,
} from "@/lib/listings/types";

type ListingBuyButtonProps = {
  whatsappPhone: string;
  slug: string;
  listingType?: ListingType | string;
  displayName: string;
  level?: number | null;
  vocation?: string | null;
  worldName?: string | null;
};

export function ListingBuyButton({
  whatsappPhone,
  slug,
  listingType = "character",
  displayName,
  level,
  vocation,
  worldName,
}: ListingBuyButtonProps) {
  const [open, setOpen] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [message, setMessage] = useState("");

  const isItemListing = listingType === "items";

  const listingUrl = useMemo(() => {
    const path = listingPublicPath(listingType, slug);
    if (typeof window === "undefined") return path;
    return `${window.location.origin}${path}`;
  }, [listingType, slug]);

  const defaultMessage = useMemo(() => {
    if (isItemListing) return "";
    return buildInterestMessage(listingUrl, displayName, {
      level,
      vocation,
      worldName,
      listingType,
    });
  }, [listingUrl, displayName, level, vocation, worldName, listingType, isItemListing]);

  function closeModal() {
    setOpen(false);
    setBuyerName("");
    setMessage("");
  }

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  function handleConfirm() {
    if (!whatsappPhone) return;
    if (isItemListing && !buyerName.trim()) return;

    const text = isItemListing
      ? buildInterestMessage(listingUrl, displayName, {
          listingType,
          buyerName: buyerName.trim(),
          worldName,
          customText: message.trim() || undefined,
        })
      : message.trim()
        ? buildInterestMessage(listingUrl, displayName, {
            customText: message.trim(),
            listingType,
          })
        : defaultMessage;

    window.open(getWhatsAppUrl(whatsappPhone, text), "_blank", "noopener,noreferrer");
    closeModal();
  }

  const canSubmit =
    Boolean(whatsappPhone) && (!isItemListing || Boolean(buyerName.trim()));

  const typeLabel =
    LISTING_TYPE_LABELS[listingType as ListingType] ??
    LISTING_TYPE_LABELS.character;
  const modalTitle =
    listingType === "character"
      ? "Comprar personagem"
      : listingType === "items"
        ? "Tenho interesse"
        : `Comprar ${typeLabel.toLowerCase()}`;
  const modalHint =
    listingType === "character"
      ? "Escreva sua mensagem para o vendedor. Se deixar em branco, enviamos uma mensagem padrão com os dados do char."
      : listingType === "items"
        ? "Informe seu nome e, se quiser, uma mensagem. O link do item sempre será enviado ao vendedor."
        : "Escreva sua mensagem para o vendedor. Se deixar em branco, enviamos uma mensagem padrão com o link do anúncio.";

  return (
    <>
      <Button
        type="button"
        className="w-full"
        disabled={!whatsappPhone}
        onClick={() => setOpen(true)}
      >
        {whatsappPhone
          ? listingType === "items"
            ? "Tenho interesse"
            : "Comprar"
          : "WhatsApp indisponível"}
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="buy-modal-title"
          onClick={() => closeModal()}
        >
          <div
            className="w-full max-w-md rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card)] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="buy-modal-title" className="text-lg font-semibold">
              {modalTitle}
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {modalHint}
            </p>

            {isItemListing && (
              <div className="mt-4">
                <Label htmlFor="buy-name">Seu nome</Label>
                <Input
                  id="buy-name"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Como o vendedor deve te chamar?"
                  className="mt-1.5"
                  autoComplete="name"
                />
              </div>
            )}

            <div className="mt-4">
              <Label htmlFor="buy-message">
                {isItemListing ? "Mensagem (opcional)" : "Sua mensagem"}
              </Label>
              <Textarea
                id="buy-message"
                rows={isItemListing ? 4 : 5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  isItemListing
                    ? "Ex.: Posso pagar à vista ou prefiro negociar."
                    : defaultMessage
                }
                className="mt-1.5 text-sm leading-relaxed"
              />
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => closeModal()}
              >
                Cancelar
              </Button>
              <Button type="button" onClick={handleConfirm} disabled={!canSubmit}>
                Enviar no WhatsApp
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
