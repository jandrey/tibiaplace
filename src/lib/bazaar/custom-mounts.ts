/**
 * RubinOT custom mounts — single source for build scripts and runtime dedupe.
 * Keep in sync with scripts/build-mounts-from-wiki.js custom list.
 */
export const CUSTOM_RUBINOT_MOUNT_NAMES = [
  "Alba Vulpes",
  "Arcane Stonehorn",
  "Astral Stonehorn",
  "Celestial Panther",
  "Chaotic Skull",
  "Crimson Stonehorn",
  "Dark Horse",
  "Emberwyrm",
  "Frostlight Sleight",
  "Frozen Vulpes",
  "Grimfeather",
  "Infernal Frostscale",
  "Infernal Stonehorn",
  "Light Horse",
  "Midnight Cosmostag",
  "Moonrocket",
  "Mystic Stonehorn",
  "Radiant Bell",
  "Radiant Stonehorn",
  "Rubini Skull",
  "Rudolph",
  "Starlight Cosmostag",
  "Tenebris Vulpes",
  "Tombmarch",
] as const;

export function normalizeMountCatalogName(name: string) {
  return String(name)
    .toLowerCase()
    .replace(/\s*\(mount\)\s*/gi, " ")
    .replace(/\s*\(montaria\)\s*/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const customNameSet = new Set(
  CUSTOM_RUBINOT_MOUNT_NAMES.map((n) => normalizeMountCatalogName(n)),
);

export function isCustomRubinotMountName(name: string) {
  return customNameSet.has(normalizeMountCatalogName(name));
}

export function customRubinotMountSlug(name: string) {
  return normalizeMountCatalogName(name).replace(/[^a-z0-9]+/g, "-");
}

export function customRubinotMountExtension(slug: string) {
  if (
    [
      "celestial-panther",
      "frozen-vulpes",
      "infernal-frostscale",
      "midnight-cosmostag",
      "starlight-cosmostag",
    ].includes(slug)
  ) {
    return "apng";
  }
  if (slug === "moonrocket") return "png";
  return "gif";
}

export function customRubinotMountImageUrl(name: string) {
  const slug = customRubinotMountSlug(name);
  const ext = customRubinotMountExtension(slug);
  return `https://wiki.rubinot.com/mounts/rubinot/${slug}.${ext}`;
}

export function buildCustomRubinotMountRecords() {
  return CUSTOM_RUBINOT_MOUNT_NAMES.map((name, i) => ({
    id: 90001 + i,
    name,
    clientId: null as number | null,
    imageUrl: customRubinotMountImageUrl(name),
    isCustom: true,
    source: "wiki-custom" as const,
  }));
}
