import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set in your .env file");
  process.exit(1);
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
