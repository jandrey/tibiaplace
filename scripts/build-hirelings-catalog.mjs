import fs from "fs";
import https from "https";

const HIRELING_LUA =
  "https://raw.githubusercontent.com/opentibiabr/canary/main/data/libs/systems/hireling.lua";

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

const lua = await get(HIRELING_LUA);

const defaultBlock = lua.match(
  /HIRELING_OUTFIT_DEFAULT = \{ name = "([^"]+)", female = (\d+), male = (\d+) \}/,
);
const outfits = [];

if (defaultBlock) {
  outfits.push(
    {
      looktype: Number(defaultBlock[2]),
      name: defaultBlock[1],
      gender: "female",
      group: "default",
    },
    {
      looktype: Number(defaultBlock[3]),
      name: defaultBlock[1],
      gender: "male",
      group: "default",
    },
  );
}

for (const m of lua.matchAll(
  /\w+ = \{ name = "([^"]+)", female = (\d+), male = (\d+) \}/g,
)) {
  const name = m[1];
  if (name === defaultBlock?.[1]) continue;
  const female = Number(m[2]);
  const male = Number(m[3]);
  const group = name.replace(/\s+Dress$/i, "").toLowerCase().replace(/\s+/g, "-");
  outfits.push(
    { looktype: female, name, gender: "female", group },
    { looktype: male, name, gender: "male", group },
  );
}

outfits.sort((a, b) => a.looktype - b.looktype);

const skillOrder = ["BANKER", "COOKING", "STEWARD", "TRADER"];
const skillNames = {
  BANKER: "Banker",
  COOKING: "Cook",
  STEWARD: "Steward",
  TRADER: "Trader",
};
const skillIcon = {
  BANKER: 1110,
  COOKING: 1114,
  STEWARD: 1116,
  TRADER: 1112,
};

const skills = skillOrder.map((key, index) => ({
  id: index + 1,
  name: skillNames[key],
  iconLooktype: skillIcon[key],
}));

fs.writeFileSync(
  "src/lib/bazaar/hirelings-outfits-catalog.json",
  `${JSON.stringify(outfits, null, 2)}\n`,
);
fs.writeFileSync(
  "src/lib/bazaar/hirelings-skills-catalog.json",
  `${JSON.stringify(skills, null, 2)}\n`,
);

console.log(`Extracted ${skills.length} hireling skills`);
console.log(`Extracted ${outfits.length} hireling outfits`);
