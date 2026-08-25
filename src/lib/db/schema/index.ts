export * from "./auth";
export * from "./catalog";
export * from "./listings";
export * from "./sprites";

import {
  account,
  accountRelations,
  session,
  sessionRelations,
  user,
  userRelations,
  verification,
} from "./auth";

import {
  catalogAchievements,
  catalogBestiaryRaces,
  catalogBlessings,
  catalogBosses,
  catalogCharms,
  catalogGems,
  catalogItems,
  catalogMounts,
  catalogOutfits,
  catalogTitles,
  catalogVocations,
  catalogWorlds,
} from "./catalog";

import { outfitSpriteCache } from "./sprites";

import {
  listingAchievements,
  listingBestiary,
  listingBlessings,
  listingBosstiaries,
  listingCharms,
  listingGems,
  listingImages,
  listingItems,
  listingMounts,
  listingOutfits,
  listingTitles,
  listingWeaponProficiency,
  listings,
  settings,
} from "./listings";

export const schema = {
  user,
  session,
  account,
  verification,
  userRelations,
  sessionRelations,
  accountRelations,
  listings,
  listingImages,
  listingOutfits,
  listingMounts,
  listingItems,
  listingCharms,
  listingBlessings,
  listingAchievements,
  listingBosstiaries,
  listingBestiary,
  listingGems,
  listingTitles,
  listingWeaponProficiency,
  settings,
  catalogOutfits,
  catalogMounts,
  catalogItems,
  catalogCharms,
  catalogBlessings,
  catalogAchievements,
  catalogBosses,
  catalogBestiaryRaces,
  catalogTitles,
  catalogGems,
  catalogVocations,
  catalogWorlds,
  outfitSpriteCache,
};
