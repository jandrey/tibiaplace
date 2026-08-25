import {
  assertBazaarData,
  type BazaarData,
} from "./types";

const RUBINOT_BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/** Headers that pass RubinOT / Cloudflare bot checks on server-side fetch. */
export function rubinotFetchInit(bazaarId?: number): RequestInit {
  return {
    headers: {
      "User-Agent": RUBINOT_BROWSER_UA,
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      Referer: bazaarId
        ? `https://rubinot.com.br/bazaar/${bazaarId}`
        : "https://rubinot.com.br/",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  };
}

export function bazaarApiUrl(bazaarId: number) {
  return `https://rubinot.com.br/api/bazaar/${bazaarId}`;
}

/** Public bazaar page (HTML) for the same listing ID. */
export function bazaarPageUrl(bazaarId: number) {
  return `https://rubinot.com.br/bazaar/${bazaarId}`;
}

export function bazaarPageUrlFromInput(url: string): string | null {
  const match = url.match(/bazaar\/(\d+)/);
  if (!match) return null;
  return bazaarPageUrl(Number.parseInt(match[1]!, 10));
}
export function bazaarApiUrlFromInput(url: string): string | null {
  const match = url.match(/bazaar\/(\d+)/);
  if (!match) return null;
  return bazaarApiUrl(Number.parseInt(match[1]!, 10));
}

export function bazaarFetchBlockedMessage(_bazaarId: number) {
  return (
    "RubinOT bloqueou o servidor (403). Use o userscript TibiaPlace no RubinOT " +
    "e clique em «Colar JSON capturado» aqui."
  );
}

export type ParsedBazaarJson = {
  bazaarData: BazaarData;
  bazaarId: number;
  bazaarUrl: string;
  playerName: string;
  playerLevel: number;
  vocationName: string;
};

/** Parse JSON from userscript / clipboard; URL is derived from auction.id. */
export function parseBazaarJsonFromText(raw: string): ParsedBazaarJson {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.trim());
  } catch {
    throw new Error(
      "JSON inválido. Copie pelo userscript «TP JSON» no RubinOT ou cole a resposta completa de /api/bazaar/{id}.",
    );
  }

  assertBazaarData(parsed);
  const bazaarId = parsed.auction.id;

  return {
    bazaarData: parsed,
    bazaarId,
    bazaarUrl: bazaarPageUrl(bazaarId),
    playerName: parsed.player.name,
    playerLevel: parsed.player.level,
    vocationName: parsed.player.vocationName ?? "",
  };
}

export async function fetchBazaarData(bazaarId: number): Promise<BazaarData> {
  const res = await fetch(bazaarApiUrl(bazaarId), rubinotFetchInit(bazaarId));

  if (res.status === 403) {
    throw new Error(bazaarFetchBlockedMessage(bazaarId));
  }

  if (!res.ok) {
    throw new Error(`Bazaar API retornou ${res.status}`);
  }

  const data = (await res.json()) as BazaarData;
  assertBazaarData(data);
  return data;
}
