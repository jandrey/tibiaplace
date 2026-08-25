const fs = require("fs");

function attr(attrs, key) {
  const m = attrs.match(new RegExp(`${key}="([^"]*)"`, "i"));
  return m ? m[1] : null;
}

function wikiMountImageUrl(name) {
  const trimmed = name.trim();
  const compact = trimmed.replace(/\s+/g, "");
  const hasMount = /\(mount\)/i.test(trimmed);
  const file = hasMount ? `${trimmed}.gif` : `${compact} (Mount).gif`;
  return `https://www.tibiawiki.com.br/wiki/Especial:FilePath/${encodeURIComponent(file)}`;
}

function rubinotMountImageUrl(clientId) {
  const params = new URLSearchParams({
    mount: String(clientId),
    direction: "3",
    animated: "1",
    walk: "1",
    size: "0",
  });
  return `https://rubinot.com.br/api/outfit?${params.toString()}`;
}

function normalizeName(name) {
  return String(name)
    .toLowerCase()
    .replace(/\s*\(mount\)\s*/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchCanaryMounts() {
  const xml = await (
    await fetch(
      "https://raw.githubusercontent.com/opentibiabr/canary/main/data/XML/mounts.xml",
    )
  ).text();
  const mounts = [];
  for (const m of xml.matchAll(/<mount\b([^>]*)\/?\s*>/gi)) {
    const attrs = m[1];
    const id = Number(attr(attrs, "id"));
    const clientId = Number(
      attr(attrs, "clientid") || attr(attrs, "clientId") || 0,
    );
    const name = attr(attrs, "name");
    if (!id || !name) continue;
    mounts.push({
      id,
      name,
      clientId: clientId || null,
    });
  }
  return mounts;
}

async function fetchWikiMounts() {
  const res = await fetch("https://tibiawiki.dev/api/mounts?expand=true");
  if (!res.ok) throw new Error(`tibiawiki mounts HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

function buildCustomRubinotMounts() {
  const names = [
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
  ];
  return names.map((name, i) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const ext = [
      "celestial-panther",
      "frozen-vulpes",
      "infernal-frostscale",
      "midnight-cosmostag",
      "starlight-cosmostag",
    ].includes(slug)
      ? "apng"
      : slug === "moonrocket"
        ? "png"
        : "gif";
    return {
      id: 90001 + i,
      name,
      clientId: null,
      imageUrl: `https://wiki.rubinot.com/mounts/rubinot/${slug}.${ext}`,
      isCustom: true,
      source: "wiki-custom",
    };
  });
}

async function main() {
  console.log("Fetching Canary mounts.xml…");
  const canary = await fetchCanaryMounts();
  console.log(`Canary: ${canary.length}`);

  console.log("Fetching TibiaWiki mounts…");
  const wiki = await fetchWikiMounts();
  console.log(`Wiki: ${wiki.length}`);

  const byClientId = new Map();
  const byName = new Map();
  for (const m of canary) {
    if (m.clientId) byClientId.set(m.clientId, m);
    byName.set(normalizeName(m.name), m);
  }

  const byId = new Map();

  // Primary: Canary IDs (used by bazaar) + TibiaWiki images
  for (const m of canary) {
    const wikiHit =
      (m.clientId ? wiki.find((w) => {
        const ids = String(w.mount_id ?? "")
          .split(",")
          .map((x) => Number(x.trim()))
          .filter(Boolean);
        return ids.includes(m.clientId);
      }) : null) ||
      wiki.find((w) => normalizeName(w.name) === normalizeName(m.name));

    const imageName = wikiHit?.name ?? m.name;
    byId.set(m.id, {
      id: m.id,
      name: wikiHit?.name ?? m.name,
      clientId: m.clientId,
      imageUrl: wikiMountImageUrl(imageName),
      isCustom: false,
      source: "tibiawiki",
    });
  }

  // Wiki-only mounts (not in canary) — synthesize ids from clientId
  let synthetic = 80000;
  for (const w of wiki) {
    const ids = String(w.mount_id ?? "")
      .split(",")
      .map((x) => Number(x.trim()))
      .filter(Boolean);
    if (ids.length === 0) continue;

    for (const clientId of ids) {
      const existing = [...byId.values()].find((m) => m.clientId === clientId);
      if (existing) {
        existing.imageUrl = wikiMountImageUrl(w.name);
        existing.name = w.name;
        continue;
      }
      const canaryHit = byClientId.get(clientId);
      if (canaryHit && byId.has(canaryHit.id)) continue;

      synthetic += 1;
      byId.set(synthetic, {
        id: synthetic,
        name: w.name,
        clientId,
        imageUrl: wikiMountImageUrl(w.name),
        isCustom: false,
        source: "tibiawiki",
      });
    }
  }

  for (const m of buildCustomRubinotMounts()) {
    byId.set(m.id, m);
  }

  const all = [...byId.values()].sort((a, b) => a.id - b.id);
  fs.mkdirSync("data", { recursive: true });
  fs.writeFileSync("data/catalog-mounts.json", JSON.stringify(all, null, 2));

  const withImages = all.filter((m) => m.imageUrl).length;
  const vanilla = all.filter((m) => !m.isCustom).length;
  console.log(
    `Wrote data/catalog-mounts.json — total=${all.length} vanilla=${vanilla} custom=${all.length - vanilla} withImages=${withImages}`,
  );
  console.log("sample", all.find((m) => m.name.includes("Widow")) || all[0]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
