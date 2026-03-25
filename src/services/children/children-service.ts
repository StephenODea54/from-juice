import type { ParseError } from "effect/ParseResult";
import type { Child, CreateChildInput, UpdateChildInput } from "./children-schema";
import { and, eq } from "drizzle-orm";
import { Array, Context, Data, Effect, Layer, Option, Schema } from "effect";
import { DatabaseService } from "@/services/db/db-service";
import {
  childrenTable,
  CreateChildSchema,
  UpdateChildSchema,
} from "./children-schema";

export class ChildNotFoundError extends Data.TaggedError("ChildNotFoundError")<{
  message: string;
}> {}

export class LastChildError extends Data.TaggedError("LastChildError")<{
  message: string;
}> {}

export class ChildrenServiceError extends Data.TaggedError("ChildrenServiceError")<{
  message: string;
  cause: unknown;
}> {}

const decodeCreateChild = Schema.decodeUnknown(CreateChildSchema);
const decodeUpdateChild = Schema.decodeUnknown(UpdateChildSchema);

export class ChildrenService extends Context.Tag("ChildrenService")<
  ChildrenService,
  {
    readonly create: (input: CreateChildInput) => Effect.Effect<Child, ParseError | ChildrenServiceError>;
    readonly readAll: (parentId: string) => Effect.Effect<Child[], ChildrenServiceError>;
    readonly readOne: (id: string, parentId: string) => Effect.Effect<Child, ChildNotFoundError | ChildrenServiceError>;
    readonly update: (input: UpdateChildInput) => Effect.Effect<Child, ParseError | ChildNotFoundError | ChildrenServiceError>;
    readonly archive: (id: string, parentId: string) => Effect.Effect<Child, ChildNotFoundError | LastChildError | ChildrenServiceError>;
  }
>() {}

export const ChildrenServiceLive = Layer.effect(
  ChildrenService,
  Effect.gen(function* () {
    const { client } = yield* DatabaseService;

    return {
      create: (input: CreateChildInput) =>
        Effect.gen(function* () {
          yield* decodeCreateChild(input);

          return yield* Effect.tryPromise({
            try: () =>
              client
                .insert(childrenTable)
                .values({
                  parentId: input.parentId,
                  name: input.name,
                  dateOfBirth: input.dateOfBirth,
                  deliveryDate: input.deliveryDate,
                  deliveryEmail: input.deliveryEmail,
                })
                .returning(),
            catch: cause => new ChildrenServiceError({ message: "Failed to insert child", cause }),
          }).pipe(
            Effect.map(Array.head),
            Effect.flatMap(Option.match({
              onNone: () => Effect.die("Insert succeeded but child was not returned"),
              onSome: Effect.succeed,
            })),
          );
        }),

      readAll: (parentId: string) =>
        Effect.tryPromise({
          try: () =>
            client
              .select()
              .from(childrenTable)
              .where(and(eq(childrenTable.parentId, parentId), eq(childrenTable.archived, false))),
          catch: cause => new ChildrenServiceError({ message: "Failed to fetch children", cause }),
        }),

      readOne: (id: string, parentId: string) =>
        Effect.tryPromise({
          try: () =>
            client
              .select()
              .from(childrenTable)
              .where(and(eq(childrenTable.id, id), eq(childrenTable.parentId, parentId))),
          catch: cause => new ChildrenServiceError({ message: "Failed to fetch child", cause }),
        }).pipe(
          Effect.map(Array.head),
          Effect.flatMap(Option.match({
            onNone: () => Effect.fail(new ChildNotFoundError({ message: `Child ${id} not found` })),
            onSome: Effect.succeed,
          })),
        ),

      update: (input: UpdateChildInput) =>
        Effect.gen(function* () {
          const decodedInput = yield* decodeUpdateChild(input);

          const existing = yield* Effect.tryPromise({
            try: () =>
              client
                .select()
                .from(childrenTable)
                .where(and(eq(childrenTable.id, input.id), eq(childrenTable.parentId, input.parentId))),
            catch: cause => new ChildrenServiceError({ message: "Failed to fetch child", cause }),
          }).pipe(
            Effect.map(Array.head),
            Effect.flatMap(Option.match({
              onNone: () => Effect.fail(new ChildNotFoundError({ message: `Child ${input.id} not found` })),
              onSome: Effect.succeed,
            })),
          );

          /* Can't use schema decoding validation for the case
             when the user specifies a new delivery date but not the existing
             date of birth.
          */
          if (decodedInput.deliveryDate && !input.dateOfBirth) {
            const existingDob = new Date(existing.dateOfBirth);
            if (decodedInput.deliveryDate <= existingDob) {
              return yield* Effect.fail(
                new ChildrenServiceError({
                  message: "Delivery date must be after date of birth",
                  cause: null,
                }),
              );
            }
          }

          return yield* Effect.tryPromise({
            try: () =>
              client
                .update(childrenTable)
                .set({
                  ...(input.name && { name: input.name }),
                  ...(input.dateOfBirth && { dateOfBirth: input.dateOfBirth }),
                  ...(input.deliveryDate && {
                    deliveryDate: input.deliveryDate,
                  }),
                  ...(input.deliveryEmail && { deliveryEmail: input.deliveryEmail }),
                })
                .where(and(eq(childrenTable.id, input.id), eq(childrenTable.parentId, input.parentId)))
                .returning(),
            catch: cause => new ChildrenServiceError({ message: "Failed to update child", cause }),
          }).pipe(
            Effect.map(Array.head),
            Effect.flatMap(Option.match({
              onNone: () => Effect.fail(new ChildNotFoundError({ message: `Child ${input.id} not found` })),
              onSome: Effect.succeed,
            })),
          );
        }),

      archive: (id: string, parentId: string) =>
        Effect.gen(function* () {
          yield* Effect.tryPromise({
            try: () =>
              client
                .select()
                .from(childrenTable)
                .where(and(eq(childrenTable.id, id), eq(childrenTable.parentId, parentId))),
            catch: cause => new ChildrenServiceError({ message: "Failed to fetch child", cause }),
          }).pipe(
            Effect.map(Array.head),
            Effect.flatMap(Option.match({
              onNone: () => Effect.fail(new ChildNotFoundError({ message: `Child ${id} not found` })),
              onSome: Effect.succeed,
            })),
          );

          const nonArchivedChildren = yield* Effect.tryPromise({
            try: () =>
              client
                .select()
                .from(childrenTable)
                .where(and(eq(childrenTable.parentId, parentId), eq(childrenTable.archived, false))),
            catch: cause => new ChildrenServiceError({ message: "Failed to fetch children", cause }),
          });

          if (nonArchivedChildren.length <= 1) {
            return yield* Effect.fail(new LastChildError({ message: "Cannot archive your only child" }));
          }

          return yield* Effect.tryPromise({
            try: () =>
              client
                .update(childrenTable)
                .set({ archived: true, archivedAt: new Date(), updatedAt: new Date() })
                .where(and(eq(childrenTable.id, id), eq(childrenTable.parentId, parentId)))
                .returning(),
            catch: cause => new ChildrenServiceError({ message: "Failed to archive child", cause }),
          }).pipe(
            Effect.map(Array.head),
            Effect.flatMap(Option.match({
              onNone: () => Effect.fail(new ChildNotFoundError({ message: `Child ${id} not found` })),
              onSome: Effect.succeed,
            })),
          );
        }),
    };
  }),
);
