import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

const devOrigins = Array.from({ length: 11 }, (_, i) => {
  const port = 3000 + i;
  return [`http://localhost:${port}`, `http://127.0.0.1:${port}`];
}).flat();

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins:
    process.env.NODE_ENV === "development"
      ? devOrigins
      : [process.env.NEXT_PUBLIC_APP_URL!].filter(Boolean),
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
