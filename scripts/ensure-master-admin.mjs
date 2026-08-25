import { randomUUID } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import { hashPassword } from "better-auth/crypto";

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

const email = (process.env.MASTER_ADMIN_EMAIL ?? "").trim().toLowerCase();
const password = process.env.MASTER_ADMIN_PASSWORD ?? "";
const name = (process.env.MASTER_ADMIN_NAME ?? "Admin").trim();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não configurada");
}
if (!email || !password) {
  throw new Error(
    "Defina MASTER_ADMIN_EMAIL e MASTER_ADMIN_PASSWORD no .env.local",
  );
}

const sql = neon(process.env.DATABASE_URL);
const issuer = "local:credential";
const now = new Date().toISOString();
const hash = await hashPassword(password);

const others =
  await sql`SELECT id, email FROM "user" WHERE lower(email) <> ${email}`;
if (others.length > 0) {
  console.log(
    `Removendo ${others.length} conta(s) extra:`,
    others.map((u) => u.email).join(", "),
  );
  for (const user of others) {
    await sql`DELETE FROM "user" WHERE id = ${user.id}`;
  }
}

const existing =
  await sql`SELECT id, email FROM "user" WHERE lower(email) = ${email} LIMIT 1`;

let userId;
if (existing.length > 0) {
  userId = existing[0].id;
  await sql`
    UPDATE "user"
    SET name = ${name}, role = 'admin', email_verified = true, updated_at = ${now}
    WHERE id = ${userId}
  `;
  console.log(`Conta mestra atualizada: ${email}`);
} else {
  userId = randomUUID();
  await sql`
    INSERT INTO "user" (id, name, email, email_verified, role, created_at, updated_at)
    VALUES (${userId}, ${name}, ${email}, true, 'admin', ${now}, ${now})
  `;
  console.log(`Conta mestra criada: ${email}`);
}

const accounts =
  await sql`SELECT id FROM account WHERE user_id = ${userId} AND provider_id = 'credential' LIMIT 1`;

if (accounts.length > 0) {
  await sql`
    UPDATE account
    SET password = ${hash}, updated_at = ${now}
    WHERE id = ${accounts[0].id}
  `;
} else {
  await sql`
    INSERT INTO account (
      id, issuer, account_id, provider_id, user_id, password, created_at, updated_at
    ) VALUES (
      ${randomUUID()}, ${issuer}, ${userId}, 'credential', ${userId}, ${hash}, ${now}, ${now}
    )
  `;
}

console.log("Senha da conta mestra sincronizada com MASTER_ADMIN_PASSWORD.");
console.log(`Login: ${email}`);
