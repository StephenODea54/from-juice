import { drizzle } from "drizzle-orm/neon-http";
import { Context, Data, Effect, Layer } from "effect";
import { BindingsService } from "@/services/bindings/bindings-service";

class DatabaseConnectionError extends Data.TaggedError("DatabaseConnectionError")<{
  message?: string;
  readonly cause: unknown;
}> {}

type DatabaseClient = ReturnType<typeof drizzle>;

export class DatabaseService extends Context.Tag("DatabaseService")<
  DatabaseService,
  { readonly client: DatabaseClient }
>() {}

export const DatabaseServiceLive = Layer.effect(
  DatabaseService,
  Effect.gen(function* () {
    const { dbConnectionUri } = yield* BindingsService;

    return yield* Effect.try({
      try: () => ({
        client: drizzle(dbConnectionUri, { casing: "snake_case" }),
      }),
      catch: cause =>
        new DatabaseConnectionError({
          message: "Failed to establish a connection to the database",
          cause,
        }),
    });
  }),
);
