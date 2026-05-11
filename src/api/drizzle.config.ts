import { defineConfig } from "drizzle-kit";

if (
  !process.env.DATABASE_URL_MIGRATION &&
  typeof process.loadEnvFile === "function"
) {
  process.loadEnvFile(".env");
}

export default defineConfig({
  out: "./drizzle",
  schema: "./src/schemas/*",
  dialect: "postgresql",
  dbCredentials: {
    // biome-ignore lint/style/noNonNullAssertion: It should exist in the env, otherwise it will fail at runtime, which is fine for this case.
    url: process.env.DATABASE_URL_MIGRATION!,
  },
  casing: "snake_case",
});
