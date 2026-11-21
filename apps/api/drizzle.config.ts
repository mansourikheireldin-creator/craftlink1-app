import { defineConfig } from "drizzle-kit";

// drizzle-kit does not load .env files itself; Node 21+ can.
try {
  process.loadEnvFile(".env.local");
} catch {
  // fall back to variables already in the environment
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
