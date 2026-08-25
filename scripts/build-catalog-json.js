const fs = require("fs");

function attr(attrs, key) {
  const m = attrs.match(new RegExp(`${key}="([^"]*)"`));
  return m ? m[1] : null;
}

function outfitImageUrl(looktype, custom = false) {
  if (custom) {
    return `https://wiki.rubinot.com/api/outfit-proxy?type=${looktype}&head=0&body=0&legs=0&feet=0&addons=3&direction=3&animated=1&walk=1&size=0`;
  }
  const params = new URLSearchParams({
    type: String(looktype),
    addons: "3",
    direction: "3",
    animated: "1",
    walk: "1",
    size: "0",
  });
  return `https://rubinot.com.br/api/outfit?${params.toString()}`;
}

function mountImageUrl(clientId) {
  const params = new URLSearchParams({
    mount: String(clientId),
    direction: "3",
    animated: "1",
    walk: "1",
    size: "0",
  });
  return `https://rubinot.com.br/api/outfit?${params.toString()}`;
}

async function main() {
  const xml = await (
    await fetch(
      "https://raw.githubusercontent.com/opentibiabr/canary/main/data/XML/outfits.xml",
    )
  ).text();

  const vanillaOutfits = [];
  for (const m of xml.matchAll(/<outfit\b([^>]*)\/?\s*>/g)) {
    const attrs = m[1];
    const looktype = Number(attr(attrs, "looktype"));
    const name = attr(attrs, "name");
    if (!looktype || !name) continue;
    const type = Number(attr(attrs, "type"));
    vanillaOutfits.push({
      looktype,
      name,
      gender: type === 0 ? "female" : type === 1 ? "male" : null,
      premium: attr(attrs, "premium") === "yes",
      source: "vanilla",
      isCustom: false,
      imageUrl: outfitImageUrl(looktype),
    });
  }

  let mountsXml = "";
  try {
    mountsXml = await (
      await fetch(
        "https://raw.githubusercontent.com/opentibiabr/canary/main/data/XML/mounts.xml",
      )
    ).text();
  } catch {
    mountsXml = "";
  }

  const vanillaMounts = [];
  if (mountsXml.includes("<mount")) {
    for (const m of mountsXml.matchAll(/<mount\b([^>]*)\/?\s*>/g)) {
      const attrs = m[1];
      const id = Number(attr(attrs, "id"));
      const clientId = Number(
        attr(attrs, "clientid") || attr(attrs, "clientId") || 0,
      );
      const name = attr(attrs, "name");
      if (!id || !name) continue;
      vanillaMounts.push({
        id,
        name,
        clientId: clientId || null,
        imageUrl: clientId ? mountImageUrl(clientId) : null,
        isCustom: false,
        source: "vanilla",
      });
    }
  }

  const customOutfits = JSON.parse(
    fs.readFileSync("data/catalog-outfits-custom.json", "utf8"),
  ).map((o) => ({
    looktype: o.looktype,
    name: o.name,
    gender: o.gender,
    premium: true,
    source: "wiki-custom",
    isCustom: true,
    imageUrl: outfitImageUrl(o.looktype, true),
  }));

  const byLt = new Map();
  for (const o of vanillaOutfits) byLt.set(o.looktype, o);
  for (const o of customOutfits) byLt.set(o.looktype, o);
  const allOutfits = [...byLt.values()].sort((a, b) => a.looktype - b.looktype);

  const customMounts = JSON.parse(
    fs.readFileSync("data/catalog-mounts.json", "utf8"),
  ).filter((m) => m.source === "wiki-custom" || m.id >= 90000);

  // rebuild custom from wiki file if needed
  const wikiMounts = [
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
  ].map((name, i) => {
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

  const byMid = new Map();
  for (const m of vanillaMounts) byMid.set(m.id, m);
  for (const m of [...customMounts, ...wikiMounts]) {
    const existingEntry = [...byMid.entries()].find(
      ([, x]) => x.name.toLowerCase() === m.name.toLowerCase(),
    );
    if (existingEntry) {
      const [existingId, existing] = existingEntry;
      if (m.isCustom && existingId !== m.id) {
        byMid.delete(existingId);
        byMid.set(m.id, m);
        continue;
      }
      existing.imageUrl = m.imageUrl || existing.imageUrl;
      if (m.clientId) existing.clientId = m.clientId;
      existing.isCustom = existing.isCustom || m.isCustom;
    } else {
      byMid.set(m.id, m);
    }
  }
  const allMounts = [...byMid.values()].sort((a, b) => a.id - b.id);

  fs.writeFileSync(
    "data/catalog-outfits.json",
    JSON.stringify(allOutfits, null, 2),
  );
  fs.writeFileSync(
    "data/catalog-mounts.json",
    JSON.stringify(allMounts, null, 2),
  );
  console.log(
    `FINAL outfits=${allOutfits.length} (custom=${customOutfits.length}, vanilla=${vanillaOutfits.length}) mounts=${allMounts.length} (vanilla=${vanillaMounts.length}, custom=${wikiMounts.length})`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
