const fs = require("fs");
const xml = fs.readFileSync("tmp-canary-items/items.xml", "utf8");
let i = 0;
const samples = [];
while ((i = xml.toLowerCase().indexOf("proficiency", i)) !== -1 && samples.length < 15) {
  samples.push(xml.slice(Math.max(0, i - 100), i + 150).replace(/\s+/g, " "));
  i += 11;
}
console.log(samples.join("\n---\n"));

// Count items with proficiency attr
const count = (xml.match(/key="proficiency"/gi) || []).length;
console.log("proficiency attrs", count);
