import {
  parseBazaarSkills,
  primarySkillKey,
  skillsForCard,
  type ParsedSkill,
} from "@/lib/bazaar/skills";
import { readLevelPercent } from "@/lib/bazaar/progress";

export type SnapshotGeneral = Record<string, unknown>;

export type ListingHighlight = {
  label: string;
  value: string;
};

export type ListingBadge = {
  id: string;
  label: string;
};

export function getSnapshotGeneral(
  snapshot: Record<string, unknown> | null | undefined,
): SnapshotGeneral | undefined {
  return snapshot?.general as SnapshotGeneral | undefined;
}

export function getListingLevelPercent(
  snapshot: Record<string, unknown> | null | undefined,
  listing?: { level?: number | null; experience?: string | null },
): number | null {
  return readLevelPercent(snapshot, listing?.level, listing?.experience);
}

export function getListingSkills(
  snapshot: Record<string, unknown> | null | undefined,
  vocation?: string | null,
): { skills: ParsedSkill[]; primaryKey: string } {
  const general = getSnapshotGeneral(snapshot);
  const rawSkills = (general?.skills as Record<string, unknown>) ?? {};
  const skills = skillsForCard(
    parseBazaarSkills(
      rawSkills,
      general?.magLevel as number | undefined,
      general?.manaSpent as string | number | undefined,
      vocation,
    ),
  );
  return { skills, primaryKey: primarySkillKey(vocation, skills) };
}

export function getListingHighlights(
  snapshot: Record<string, unknown> | null | undefined,
  listing: {
    achievementPoints?: number | null;
    outfitsCount?: number | null;
    mountsCount?: number | null;
  },
): ListingHighlight[] {
  const general = getSnapshotGeneral(snapshot);
  const gems = snapshot?.gems as unknown[] | undefined;
  const blessings = snapshot?.blessings as unknown[] | undefined;
  const charms = snapshot?.charms as unknown[] | undefined;

  const charmAvailable = Number(general?.availableCharmPoints ?? 0);
  const charmSpent = Number(general?.spentCharmPoints ?? 0);
  const bossPoints = Number(general?.bossPoints ?? 0);
  const dust = Number(general?.dust ?? 0);
  const dustMax = Number(general?.dustMax ?? 0);

  const highlights: ListingHighlight[] = [
    {
      label: "Achievements",
      value: String(listing.achievementPoints ?? general?.achievementPoints ?? 0),
    },
    {
      label: "Charms",
      value: `${charmAvailable.toLocaleString("pt-BR")} / ${charmSpent.toLocaleString("pt-BR")}`,
    },
    {
      label: "Boss points",
      value: bossPoints.toLocaleString("pt-BR"),
    },
    {
      label: "Outfits",
      value: String(listing.outfitsCount ?? general?.outfitsCount ?? 0),
    },
    {
      label: "Montarias",
      value: String(listing.mountsCount ?? general?.mountsCount ?? 0),
    },
  ];

  if (gems && gems.length > 0) {
    highlights.push({ label: "Gems", value: String(gems.length) });
  }
  if (blessings && blessings.length > 0) {
    highlights.push({
      label: "Bênçãos",
      value: `${blessings.length}/8`,
    });
  }
  if (charms && charms.length > 0) {
    highlights.push({ label: "Charms ativos", value: String(charms.length) });
  }
  if (dustMax > 0) {
    highlights.push({
      label: "Dust",
      value: `${dust}/${dustMax}`,
    });
  }

  return highlights;
}

export function getListingBadges(
  snapshot: Record<string, unknown> | null | undefined,
  listing: {
    outfitsCount?: number | null;
    mountsCount?: number | null;
    achievementPoints?: number | null;
  },
): ListingBadge[] {
  const general = getSnapshotGeneral(snapshot);
  const badges: ListingBadge[] = [];

  const charmSpent = Number(general?.spentCharmPoints ?? 0);
  const bossPoints = Number(general?.bossPoints ?? 0);
  const outfits = listing.outfitsCount ?? Number(general?.outfitsCount ?? 0);
  const mounts = listing.mountsCount ?? Number(general?.mountsCount ?? 0);
  const achievements =
    listing.achievementPoints ?? Number(general?.achievementPoints ?? 0);

  if (charmSpent >= 1500) {
    badges.push({ id: "charms", label: "Muitos charms" });
  }
  if (outfits >= 20) {
    badges.push({ id: "outfits", label: "Muitos outfits" });
  }
  if (mounts >= 5) {
    badges.push({ id: "mounts", label: "Várias montarias" });
  }
  if (bossPoints >= 500) {
    badges.push({ id: "boss", label: "Boss hunter" });
  }
  if (achievements >= 80) {
    badges.push({ id: "achievements", label: "Muitas conquistas" });
  }
  if (general?.charmExpansion) {
    badges.push({ id: "charm-exp", label: "Charm expansion" });
  }
  if (general?.thirdPrey) {
    badges.push({ id: "prey", label: "Prey slot" });
  }

  return badges.slice(0, 4);
}

export function getGeneralStats(
  snapshot: Record<string, unknown> | null | undefined,
  listing: {
    experience?: string | null;
    gold?: string | null;
    achievementPoints?: number | null;
    outfitsCount?: number | null;
    mountsCount?: number | null;
  },
  privacy: { hideGold?: boolean },
) {
  const general = getSnapshotGeneral(snapshot);
  const blessings = (snapshot?.blessings as unknown[] | undefined)?.length ?? 0;
  const titles = (snapshot?.titles as unknown[] | undefined)?.length ?? 0;

  const rows: Array<{ label: string; value: string }> = [
    {
      label: "Pontos de Vida",
      value: Number(general?.healthMax ?? 0).toLocaleString("pt-BR") || "—",
    },
    {
      label: "Mana",
      value: Number(general?.manaMax ?? 0).toLocaleString("pt-BR") || "—",
    },
    {
      label: "Capacidade",
      value: Number(general?.cap ?? 0).toLocaleString("pt-BR") || "—",
    },
    { label: "Bênçãos", value: `${blessings}/8` },
    {
      label: "Montarias",
      value: String(listing.mountsCount ?? general?.mountsCount ?? 0),
    },
    {
      label: "Outfits",
      value: String(listing.outfitsCount ?? general?.outfitsCount ?? 0),
    },
    { label: "Títulos", value: String(titles || general?.titlesCount || 0) },
    {
      label: "Experiência",
      value: Number(listing.experience ?? general?.experience ?? 0).toLocaleString(
        "pt-BR",
      ),
    },
    {
      label: "Pontos de Conquista",
      value: String(listing.achievementPoints ?? general?.achievementPoints ?? 0),
    },
    {
      label: "Charm Points",
      value: `${Number(general?.availableCharmPoints ?? 0).toLocaleString("pt-BR")} disp. / ${Number(general?.spentCharmPoints ?? 0).toLocaleString("pt-BR")} gastos`,
    },
    {
      label: "Boss Points",
      value: Number(general?.bossPoints ?? 0).toLocaleString("pt-BR"),
    },
    {
      label: "Hunting Task",
      value: Number(general?.huntingTaskPoints ?? 0).toLocaleString("pt-BR"),
    },
    {
      label: "Exalted Dust",
      value: `${Number(general?.dust ?? 0)}/${Number(general?.dustMax ?? 0)}`,
    },
    {
      label: "Wheel",
      value: `${Number(general?.wheelPoints ?? 0)}/${Number(general?.maxWheelPoints ?? 0)}`,
    },
    {
      label: "Hirelings",
      value: String(general?.hirelingCount ?? 0),
    },
  ];

  if (!privacy.hideGold) {
    rows.splice(8, 0, {
      label: "Ouro",
      value: Number(listing.gold ?? general?.balance ?? 0).toLocaleString("pt-BR"),
    });
  }

  return rows.filter((row) => row.value !== "0" && row.value !== "0/0");
}
