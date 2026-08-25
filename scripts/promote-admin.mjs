import { neon } from "@neondatabase/serverless";
import { readFileSync, existsSync } from "fs";

for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

const sql = neon(process.env.DATABASE_URL);

await sql`UPDATE "user" SET role = 'admin' WHERE email = 'vendedor@teste.com'`;
const users = await sql`SELECT email, role FROM "user"`;
console.log(users);
