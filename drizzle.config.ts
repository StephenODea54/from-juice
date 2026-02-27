import { defineConfig } from "drizzle-kit";

const dbConnectionUri = process.env.DB_CONNECTION_URI;

if (!dbConnectionUri) {
  throw new Error("DB_CONNECTION_URI must be set to run Drizzle CLI commands");
}

export default defineConfig({
  out: "./src/services/db/migrations",
  schema: "./src/**/*-schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: dbConnectionUri,
  },
  migrations: {
    schema: "metadata",
    table: "migrations",
  },
  casing: "snake_case",
});
