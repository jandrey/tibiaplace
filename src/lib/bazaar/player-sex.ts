/** RubinOT / Canary PLAYERSEX: 0 = female, 1 = male. */
export const PLAYER_SEX_FEMALE = 0;
export const PLAYER_SEX_MALE = 1;

export const PLAYER_SEX_OPTIONS = [
  { value: String(PLAYER_SEX_FEMALE), label: "Feminino" },
  { value: String(PLAYER_SEX_MALE), label: "Masculino" },
] as const;

export function playerSexLabel(sex: number | null | undefined): string {
  if (sex === PLAYER_SEX_FEMALE) return "Feminino";
  if (sex === PLAYER_SEX_MALE) return "Masculino";
  return "—";
}
