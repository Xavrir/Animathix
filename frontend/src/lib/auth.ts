import { LibsqlDialect } from "@libsql/kysely-libsql";
import { betterAuth } from "better-auth";

const tursoUrl = process.env.TURSO_DATABASE_URL || "file:./animathix-auth.db";
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const authBaseUrl =
  process.env.BETTER_AUTH_URL ||
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
  "http://localhost:3000";

export const auth = betterAuth({
  secret:
    process.env.BETTER_AUTH_SECRET ||
    "dev-only-secret-change-me-please-set-a-real-one",
  baseURL: authBaseUrl,
  database: {
    dialect: new LibsqlDialect({
      url: tursoUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    }),
    type: "sqlite",
  },
  socialProviders:
    googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          },
        }
      : {},
});
