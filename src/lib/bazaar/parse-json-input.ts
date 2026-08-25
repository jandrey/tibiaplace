import { assertBazaarData } from "./types";
import { bazaarPageUrl } from "./rubinot-fetch";

export type BazaarJsonPreview = {
  bazaarId: number;
  bazaarUrl: string;
  characterName: string;
  level: number;
  vocation: string;
  worldName: string;
};

export function previewBazaarJsonInput(raw: string):
  | { ok: true; preview: BazaarJsonPreview; data: unknown }
  | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "Cole o JSON capturado pelo script TP JSON no RubinOT." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { ok: false, error: "JSON inválido. Copie a resposta completa de /api/bazaar/{id}." };
  }

  try {
    assertBazaarData(parsed);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "JSON do bazaar incompleto",
    };
  }

  const data = parsed as {
    auction: { id: number };
    player: {
      name: string;
      level: number;
      vocationName: string;
      worldName: string;
    };
  };

  const bazaarId = data.auction.id;
  return {
    ok: true,
    data: parsed,
    preview: {
      bazaarId,
      bazaarUrl: bazaarPageUrl(bazaarId),
      characterName: data.player.name,
      level: data.player.level,
      vocation: data.player.vocationName,
      worldName: data.player.worldName,
    },
  };
}
