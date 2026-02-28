import { sql } from "drizzle-orm";
import { boolean, check, index, pgSchema, text, timestamp } from "drizzle-orm/pg-core";
import { generateCommonCols } from "@/services/db/utils/generate-common-cols";

export const authSchema = pgSchema("auth");

export const usersTable = authSchema.table("users", {
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: text(),
  isOnboardingComplete: boolean().notNull().default(false),
  isArchived: boolean().notNull().default(false),
  archivedAt: timestamp({ withTimezone: true }),
  ...generateCommonCols("USR"),
}, t => [
  index("users_email_idx").on(t.email),
  check("archived_consistency", sql`
    (${t.isArchived} = TRUE AND ${t.archivedAt} IS NOT NULL)
    OR
    (${t.isArchived} = FALSE AND ${t.archivedAt} IS NULL)
  `),
]);

export const accountsTable = authSchema.table("accounts", {
  userId: text().notNull().references(() => usersTable.id),
  accountId: text().notNull(),
  providerId: text().notNull(),
  accessToken: text(),
  refreshToken: text(),
  accessTokenExpiresAt: timestamp({ withTimezone: true }),
  refreshTokenExpiresAt: timestamp({ withTimezone: true }),
  scope: text(),
  idToken: text(),
  password: text(),
  ...generateCommonCols("ACC"),
}, t => [
  index("accounts_user_id_idx").on(t.userId),
]);

export const verificationsTable = authSchema.table("verifications", {
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  ...generateCommonCols("VER"),
}, t => [
  index("verifications_identifier_idx").on(t.identifier),
]);
