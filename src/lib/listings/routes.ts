import type { LucideIcon } from "lucide-react";
import { Coins, Handshake, Package, User } from "lucide-react";
import type { ListingType } from "@/lib/listings/types";

export type MarketplaceSectionId = ListingType | "intermediario";

export type MarketplaceSection = {
  id: MarketplaceSectionId;
  href: string;
  label: string;
  headline: string;
  description: string;
  ctaLabel?: string;
  icon: LucideIcon;
  glow: string;
  accent: string;
  ring: string;
  chip: string;
};

export const MARKETPLACE_SECTIONS: MarketplaceSection[] = [
  {
    id: "character",
    href: "/chars",
    label: "Personagens",
    headline: "Chars completos do Bazaar",
    description:
      "Skills, itens, charms, outfits e montarias importados com dados reais.",
    icon: User,
    glow: "bg-[var(--color-primary)]/18",
    accent: "text-[var(--color-gold)]",
    ring: "group-hover:shadow-[var(--color-primary)]/18",
    chip: "bg-[var(--color-primary-muted)] text-[var(--color-gold)] ring-[var(--color-primary)]/28",
  },
  {
    id: "rubini_coins",
    href: "/coins",
    label: "Rubini Coins",
    headline: "Compre coins por lote",
    description:
      "Escolha a quantidade, veja descontos progressivos e finalize no WhatsApp.",
    icon: Coins,
    glow: "bg-[var(--color-gold)]/16",
    accent: "text-[var(--color-gold)]",
    ring: "group-hover:shadow-[var(--color-gold)]/16",
    chip: "bg-[var(--color-primary-muted)] text-[var(--color-gold)] ring-[var(--color-gold-dim)]/30",
  },
  {
    id: "items",
    href: "/items",
    label: "Itens",
    headline: "Equipamentos e raridades",
    description:
      "Anúncios de itens específicos com tier, quantidade e preço transparente.",
    icon: Package,
    glow: "bg-[var(--color-secondary)]/16",
    accent: "text-[var(--color-secondary)]",
    ring: "group-hover:shadow-[var(--color-secondary)]/16",
    chip: "bg-[var(--color-secondary-muted)] text-[var(--color-secondary)] ring-[var(--color-secondary)]/28",
  },
  {
    id: "intermediario",
    href: "/intermediario",
    label: "Intermédio",
    headline: "Negocie com segurança",
    description:
      "Intermediação de item ou personagem com acompanhamento do vendedor na negociação.",
    ctaLabel: "Solicitar intermediação",
    icon: Handshake,
    glow: "bg-[var(--color-success)]/16",
    accent: "text-[var(--color-success)]",
    ring: "group-hover:shadow-[var(--color-success)]/16",
    chip: "bg-[var(--color-success-muted)] text-[var(--color-success)] ring-[var(--color-success)]/28",
  },
];

export function sectionByPath(pathname: string): MarketplaceSection | null {
  return (
    MARKETPLACE_SECTIONS.find(
      (section) =>
        pathname === section.href || pathname.startsWith(`${section.href}/`),
    ) ?? null
  );
}

export function sectionHref(id: MarketplaceSectionId): string {
  return MARKETPLACE_SECTIONS.find((section) => section.id === id)?.href ?? "/";
}
