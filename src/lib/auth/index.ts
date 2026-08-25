import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

const devOrigins = Array.from({ length: 11 }, (_, i) => {
  const port = 3000 + i;
  return [`http://localhost:${port}`, `http://127.0.0.1:${port}`];
}).flat();

function toOrigin(url: string | undefined): string | undefined {
  if (!url?.trim()) return undefined;
  try {
    return new URL(url.trim()).origin;
  } catch {
    return undefined;
  }
}

/** Public app URL for cookies and callbacks. */
function resolveAppBaseUrl(): string | undefined {
  const vercelOrigin = process.env.VERCEL_URL
    ? toOrigin(`https://${process.env.VERCEL_URL}`)
    : undefined;

  const candidates =
    process.env.NODE_ENV === "production"
      ? [
          process.env.BETTER_AUTH_URL,
          process.env.NEXT_PUBLIC_APP_URL,
          vercelOrigin ? `https://${process.env.VERCEL_URL}` : undefined,
        ].filter((url) => url?.trim() && !url.includes("localhost"))
      : [
          process.env.BETTER_AUTH_URL,
          process.env.NEXT_PUBLIC_APP_URL,
          vercelOrigin ? `https://${process.env.VERCEL_URL}` : undefined,
        ];

  for (const url of candidates) {
    const origin = toOrigin(url);
    if (origin) return origin;
  }
  return undefined;
}

function extraTrustedOrigins(): string[] {
  const origins = new Set<string>();

  for (const url of [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.BETTER_AUTH_URL,
  ]) {
    const origin = toOrigin(url);
    if (origin && !origin.includes("localhost")) origins.add(origin);
  }

  if (process.env.VERCEL_URL) {
    origins.add(`https://${process.env.VERCEL_URL}`);
  }

  // Preview/production Vercel URLs (e.g. tibiaplace.vercel.app)
  origins.add("https://*.vercel.app");

  const envExtra = process.env.BETTER_AUTH_TRUSTED_ORIGINS;
  if (envExtra) {
    for (const part of envExtra.split(",")) {
      const origin = toOrigin(part);
      if (origin) origins.add(origin);
    }
  }

  return [...origins];
}

const appBaseUrl = resolveAppBaseUrl();
const isDev = process.env.NODE_ENV === "development";

export const auth = betterAuth({
  baseURL: appBaseUrl,
  // Array replaces Better Auth's merged origins in CSRF checks — use a function in prod
  // so baseURL + extras are all validated (fixes Invalid origin on Vercel).
  ...(isDev
    ? { trustedOrigins: devOrigins }
    : { trustedOrigins: async () => extraTrustedOrigins() }),
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
