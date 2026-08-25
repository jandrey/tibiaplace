/** RubinOT custom outfits start at looktype 2501 in catalog-outfits-custom.json */
export const CUSTOM_RUBINOT_OUTFIT_LOOKTYPE_MIN = 2501;

export function isCustomRubinotOutfit(looktype: number) {
  return looktype >= CUSTOM_RUBINOT_OUTFIT_LOOKTYPE_MIN;
}
