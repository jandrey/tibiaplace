import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

const devOrigins = Array.from({ length: 11 }, (_, i) => {
  const port = 3000 + i;
  return [`http://localhost:${port}`, `http://127.0.0.1:${port}`];
}).flat();

function normalizeOrigin(url: string): string {
  return url.replace(/\/$/, "");
}

/** Resolves the public app URL (Better Auth cookies, callbacks). */
function resolveAppBaseUrl(): string | undefined {
  const candidates = [
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : undefined,
  ];
  for (const url of candidates) {
    if (url?.trim()) return normalizeOrigin(url.trim());
  }
  return undefined;
}

function resolveTrustedOrigins(baseURL: string | undefined): string[] {
  if (process.env.NODE_ENV === "development") return devOrigins;

  const origins = new Set<string>();
  for (const url of [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.BETTER_AUTH_URL,
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : undefined,
    baseURL,
  ]) {
    if (url?.trim()) origins.add(normalizeOrigin(url.trim()));
  }
  return [...origins];
}

const appBaseUrl = resolveAppBaseUrl();

export const auth = betterAuth({
  baseURL: appBaseUrl,
  trustedOrigins: resolveTrustedOrigins(appBaseUrl),
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "seller",
        input: false,
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
