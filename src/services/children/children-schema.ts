import { relations, sql } from "drizzle-orm";
import { boolean, check, date, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { Schema } from "effect";
import { usersTable } from "@/services/auth/auth-schema";
import { generateCommonCols } from "@/services/db/utils/generate-common-cols";

export const childrenTable = pgTable("children", {
  ...generateCommonCols("CHD"),
  parentId: text().notNull().references(() => usersTable.id),
  name: text().notNull(),
  dateOfBirth: date().notNull(),
  deliveryDate: date(),
  deliveryEmail: text(),
  archived: boolean().notNull().default(false),
  archivedAt: timestamp({ withTimezone: true }),
}, t => [
  index("children_parent_id_idx").on(t.parentId),
  check("dob_not_in_future", sql`${t.dateOfBirth} <= CURRENT_DATE`),
  check("delivery_after_birth", sql`${t.deliveryDate} IS NULL OR ${t.deliveryDate} > ${t.dateOfBirth}`),
  check("delivery_in_future", sql`${t.deliveryDate} IS NULL OR ${t.deliveryDate} > CURRENT_DATE`),
  check("archived_consistency", sql`
    (${t.archived} = TRUE AND ${t.archivedAt} IS NOT NULL)
    OR
    (${t.archived} = FALSE AND ${t.archivedAt} IS NULL)
  `),
]);

export const childrenTableRelations = relations(childrenTable, ({ one }) => ({
  parent: one(usersTable, {
    fields: [childrenTable.parentId],
    references: [usersTable.id],
  }),
}));

export type Child = typeof childrenTable.$inferSelect;

const dobSchema = Schema.DateFromString.pipe(
  Schema.filter(
    (dob) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return dob <= today;
    },
    { message: () => "Date of birth cannot be in the future" },
  ),
);

const deliveryDateSchema = Schema.DateFromString.pipe(
  Schema.filter(
    (date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date > today;
    },
    { message: () => "Delivery date must be in the future" },
  ),
);

export const CreateChildSchema = Schema.Struct({
  parentId: Schema.String,
  name: Schema.String,
  dateOfBirth: dobSchema,
  deliveryDate: Schema.NullOr(deliveryDateSchema),
  deliveryEmail: Schema.NullOr(Schema.String),
}).pipe(
  Schema.filter(
    (input) => {
      if (input.deliveryDate && input.dateOfBirth) {
        return input.deliveryDate > input.dateOfBirth;
      }
      return true;
    },
    { message: () => "Delivery date must be after date of birth" },
  ),
);

export const UpdateChildSchema = Schema.Struct({
  id: Schema.String,
  parentId: Schema.String,
  name: Schema.optional(Schema.String),
  dateOfBirth: Schema.optional(dobSchema),
  deliveryDate: Schema.optional(Schema.NullOr(deliveryDateSchema)),
  deliveryEmail: Schema.optional(Schema.NullOr(Schema.String)),
}).pipe(
  Schema.filter(
    (input) => {
      if (input.deliveryDate && input.dateOfBirth) {
        return input.deliveryDate > input.dateOfBirth;
      }
      return true;
    },
    { message: () => "Delivery date must be after date of birth" },
  ),
);

export type CreateChildInput = Schema.Schema.Encoded<typeof CreateChildSchema>;
export type UpdateChildInput = Schema.Schema.Encoded<typeof UpdateChildSchema>;
