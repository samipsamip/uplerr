import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { account, session, user, verification } from "../schemas/auth-schema";
import db from "../utils/db";
import ProductEmail from "../utils/email_utils";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  baseURL: process.env.AUTH_BASE_URL ?? "http://localhost:3000/",
  trustedOrigins: process.env.TRUSTED_ORIGINS
    ? process.env.TRUSTED_ORIGINS.split(",")
    : ["http://localhost:5173"],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: true,
    sendResetPasswordEmail: true,
    revokeSessionsOnPasswordReset: true,
  },
  rateLimit: {
    window: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url, token }, _request) => {
      console.log("I am firing ?");
      void ProductEmail.sendVerificationEmail(user.email, url, token);
    },
  },
});
