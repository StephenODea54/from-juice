import { text, timestamp } from "drizzle-orm/pg-core";

export function generateCommonCols(monogram: string) {
  if (monogram.length === 0) {
    throw new Error("Monogram must be at least 1 character long");
  }

  return {
    id: text().primaryKey().$defaultFn(() => `${monogram}-${crypto.randomUUID()}`),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  };
}
