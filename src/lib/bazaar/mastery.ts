import { bestiaryRaceName } from "@/lib/bazaar/bestiary";

/** RubinOT bazaar `mastery` is an array of bestiary race IDs (numbers). */
export function masteryEntryLabel(entry: unknown, index: number): string {
  if (typeof entry === "string") {
    const trimmed = entry.trim();
    if (trimmed) return trimmed;
  }
  if (typeof entry === "number" && Number.isFinite(entry)) {
    return bestiaryRaceName(entry);
  }
  if (entry && typeof entry === "object") {
    const obj = entry as Record<string, unknown>;
    if (typeof obj.name === "string" && obj.name.trim()) return obj.name.trim();
    if (typeof obj.raceName === "string" && obj.raceName.trim()) {
      return obj.raceName.trim();
    }
    const raceId = obj.raceId ?? obj.id;
    if (typeof raceId === "number" && Number.isFinite(raceId)) {
      return bestiaryRaceName(raceId);
    }
    if (typeof raceId === "string" && /^\d+$/.test(raceId)) {
      return bestiaryRaceName(Number(raceId));
    }
  }
  return `Monstro #${index + 1}`;
}

export function masteryEntryKey(entry: unknown, index: number): string {
  if (typeof entry === "number") return `race-${entry}`;
  if (typeof entry === "string") return `name-${entry}-${index}`;
  if (entry && typeof entry === "object") {
    const obj = entry as Record<string, unknown>;
    const raceId = obj.raceId ?? obj.id;
    if (raceId != null) return `race-${raceId}`;
  }
  return `idx-${index}`;
}
