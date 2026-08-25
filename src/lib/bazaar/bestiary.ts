import catalog from "@/lib/bazaar/bestiary-catalog.json";

export type BestiaryRace = {
  id: number;
  name: string;
};

const byId = new Map<number, string>(
  (catalog as BestiaryRace[]).map((r) => [r.id, r.name]),
);

export function bestiaryRaceName(raceId: number) {
  return byId.get(raceId) ?? `Monstro #${raceId}`;
}
