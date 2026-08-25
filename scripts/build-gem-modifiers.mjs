import fs from "fs";
import https from "https";

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "TibiaPlace" } }, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

function parseEnum(text, name) {
  const match = text.match(
    new RegExp(`enum class ${name}[\\s\\S]*?\\};`),
  );
  if (!match) return [];
  const lines = match[0].split("\n").slice(1, -1);
  let idx = -1;
  const out = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("//")) continue;
    const cm = line.match(/^([A-Za-z0-9_]+)(?:\s*=\s*(\d+))?/);
    if (!cm) continue;
    if (cm[2] !== undefined) idx = Number(cm[2]);
    else idx += 1;
    out.push({ id: idx, name: cm[1] });
  }
  return out;
}

function pretty(name) {
  const spaced = name
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
  return spaced
    .replace(/^General /, "")
    .replace(/^Vocation /, "Vocation ")
    .replace(/Revelation Mastery/g, "Revelation Mastery")
    .replace(/Critical Extra Damage/g, "Critical Extra Damage")
    .replace(/Damage Increase/g, "Damage Increase")
    .replace(/Healing Increase/g, "Healing Increase")
    .replace(/Cooldown/g, "Cooldown");
}

const src = await get(
  "https://raw.githubusercontent.com/opentibiabr/canary/main/src/enums/player_wheel.hpp",
);
const basic = parseEnum(src, "WheelGemBasicModifier_t");
const supreme = parseEnum(src, "WheelGemSupremeModifier_t");

const basicMap = Object.fromEntries(
  basic.map((entry) => [entry.id, pretty(entry.name)]),
);
const supremeMap = Object.fromEntries(
  supreme.map((entry) => [entry.id, pretty(entry.name)]),
);

const out = { basic: basicMap, supreme: supremeMap };
fs.writeFileSync(
  "src/lib/bazaar/gem-modifiers.json",
  `${JSON.stringify(out, null, 2)}\n`,
);

console.log("basic", basic.length, "supreme", supreme.length);
console.log("41", basicMap[41]);
console.log("2", basicMap[2]);
console.log("supreme 15", supremeMap[15]);
