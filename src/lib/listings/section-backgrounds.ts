import type { MarketplaceSectionId } from "@/lib/listings/routes";

export type SectionBackground = {
  /** Path under /public */
  image: string;
  position: string;
  /** Tailwind gradient stops for readability overlay */
  overlayFrom: string;
  overlayVia: string;
  overlayTo: string;
  tint: string;
};

/** Official Tibia client/login artworks (TibiaWiki BR). */
export const SECTION_BACKGROUNDS: Record<MarketplaceSectionId, SectionBackground> =
  {
    character: {
      image: "/sections/character.jpg",
      position: "center 42%",
      overlayFrom: "from-[#0a0e17]/97",
      overlayVia: "via-[#081210]/80",
      overlayTo: "to-[#0a0e17]/98",
      tint: "bg-[var(--glow-secondary)]/10",
    },
    rubini_coins: {
      image: "/sections/rubini-coins.jpg",
      position: "center center",
      overlayFrom: "from-[#0a0e17]/93",
      overlayVia: "via-[#141008]/70",
      overlayTo: "to-[#0a0e17]/96",
      tint: "bg-[var(--color-gold)]/10",
    },
    items: {
      image: "/sections/items.jpg",
      position: "center 42%",
      overlayFrom: "from-[#0a0e17]/94",
      overlayVia: "via-[#0a1018]/74",
      overlayTo: "to-[#0a0e17]/97",
      tint: "bg-[var(--glow-secondary)]",
    },
    intermediario: {
      image: "/sections/intermediario.jpg",
      position: "center 38%",
      overlayFrom: "from-[#0a0e17]/93",
      overlayVia: "via-[#081210]/72",
      overlayTo: "to-[#0a0e17]/96",
      tint: "bg-[var(--color-success)]/10",
    },
  };
