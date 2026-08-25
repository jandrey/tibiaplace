const fs = require("fs");
const path = require("path");

const xml = fs.readFileSync("tmp-canary-items/items.xml", "utf8");
const prof = JSON.parse(
  fs.readFileSync("tmp-canary-items/proficiencies.json", "utf8"),
);

// Build id -> name from items.xml
const byId = new Map();
const itemRe =
  /<item\s+([^>]*?)\s*\/?>|<item\s+([^>]*?)>/gi;
let m;
while ((m = itemRe.exec(xml))) {
  const attrs = m[1] || m[2] || "";
  const idM = attrs.match(/\bid="(\d+)"/);
  const fromM = attrs.match(/\bfromid="(\d+)"/);
  const toM = attrs.match(/\btoid="(\d+)"/);
  const nameM = attrs.match(/\bname="([^"]+)"/);
  if (!nameM) continue;
  const name = nameM[1];
  if (idM) byId.set(Number(idM[1]), name);
  if (fromM && toM) {
    const a = Number(fromM[1]);
    const b = Number(toM[1]);
    for (let i = a; i <= b; i++) byId.set(i, name);
  }
}

console.log("items mapped", byId.size);

// Proficiencies have Name like "Sanguine 1H Sword" - match to items?
const names = prof.map((p) => p.Name);
console.log("prof names sample", names.slice(0, 20));
console.log("total prof", names.length);

// Try match sanguine
for (const [id, name] of byId) {
  if (/sanguine/i.test(name)) console.log("item", id, name);
}

// Check bazaar inventory items: do clientIds resolve in xml?
const bazaar = JSON.parse(
  fs.readFileSync("data/bazaar-270418.json", "utf8"),
);
let ok = 0;
let bad = 0;
const samples = [];
for (const item of bazaar.items || []) {
  const n = byId.get(item.clientId);
  if (n) {
    ok++;
    if (samples.length < 5) samples.push({ ...item, xmlName: n });
  } else {
    bad++;
    if (bad <= 5) console.log("client miss", item.clientId, item.name, item.itemId);
  }
}
console.log("clientId resolve", { ok, bad, samples });

// Does itemId resolve?
ok = 0;
bad = 0;
for (const item of bazaar.items || []) {
  if (byId.has(item.itemId)) ok++;
  else bad++;
}
console.log("itemId resolve", { ok, bad });

// For weapons in proficiency from DB listing - we need server->client.
// Build map from ALL bazaar items where we have both
const map = new Map();
for (const item of [
  ...(bazaar.items || []),
  ...(bazaar.storeItems || []),
  ...(bazaar.highlightItems || []),
]) {
  if (item.itemId && item.clientId && item.name) {
    map.set(item.itemId, { clientId: item.clientId, name: item.name });
  }
}
console.log("bazaar map size", map.size);
for (const id of [51749, 46650, 25522, 51750]) {
  console.log("map", id, map.get(id), "xml client", byId.get(map.get(id)?.clientId));
}
