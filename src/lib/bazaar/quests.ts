/** RubinOT bazaar quest checklist — same catalog as rubinot.com.br bazaar UI. */
export type BazaarQuestDefinition = {
  name: string;
  storageId: number;
  requiredValue: number;
};

export const BAZAAR_QUEST_CATALOG: BazaarQuestDefinition[] = [
  { name: "Soul War", storageId: 21216, requiredValue: 1 },
  { name: "In Service of Yalahar", storageId: 12250, requiredValue: 5 },
  { name: "Wrath of the Emperor", storageId: 12362, requiredValue: 1 },
  { name: "Primal Ordeal", storageId: 14104, requiredValue: 1 },
  { name: "No Rest for The Wicked", storageId: 14260, requiredValue: 1 },
  { name: "Paradise Lost", storageId: 10211, requiredValue: 1 },
  { name: "Ferumbras' Ascendant", storageId: 7090, requiredValue: 1 },
  { name: "The Inquisition", storageId: 12177, requiredValue: 1 },
  { name: "Hidden City of Beregar", storageId: 12594, requiredValue: 1 },
  { name: "Shadow of Yalahar", storageId: 12877, requiredValue: 1 },
  { name: "Pits of Inferno", storageId: 10544, requiredValue: 1 },
  { name: "The Order of the Stag", storageId: 3251, requiredValue: 16 },
  { name: "Bloody Tusks", storageId: 3231, requiredValue: 16 },
  { name: "Secret Service", storageId: 3469, requiredValue: 2 },
  { name: "The Rise of Podzilla", storageId: 14231, requiredValue: 18 },
  { name: "20 Years A Cook", storageId: 3351, requiredValue: 26 },
  { name: "Rotten Blood", storageId: 10301, requiredValue: 4 },
  { name: "Between the Lines", storageId: 3201, requiredValue: 14 },
  { name: "The Roost of the Graveborn", storageId: 3291, requiredValue: 16 },
  { name: "Shards of a Broken Moon", storageId: 3601, requiredValue: 19 },
  { name: "Make Believe", storageId: 3651, requiredValue: 17 },
];

export type BazaarQuestRow = {
  name: string;
  completed: boolean;
};

function storageMap(
  storages: Array<[number, string]> | undefined,
): Map<number, bigint> {
  const map = new Map<number, bigint>();
  for (const [storageId, rawValue] of storages ?? []) {
    try {
      map.set(storageId, BigInt(rawValue));
    } catch {
      // Ignore malformed storage values from the bazaar payload.
    }
  }
  return map;
}

/** Derives quest completion from bazaar `storages`, matching RubinOT's bazaar page. */
export function deriveQuestsFromStorages(
  storages: Array<[number, string]> | undefined,
): BazaarQuestRow[] {
  const values = storageMap(storages);

  return BAZAAR_QUEST_CATALOG.map((quest) => {
    const current = values.get(quest.storageId);
    const completed =
      current !== undefined && current >= BigInt(quest.requiredValue);

    return {
      name: quest.name,
      completed,
    };
  });
}
