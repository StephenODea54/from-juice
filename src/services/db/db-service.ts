import { drizzle } from "drizzle-orm/neon-http";
import { Context, Data, Effect, Layer, Redacted } from "effect";
import { AppConfig, AppConfigTestLayer } from "@/services/config/config-service";

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
    const config = yield* AppConfig;
    const dbConnectionUri = Redacted.value(config.dbConnectionUri);

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

export const DatabaseServiceTest = DatabaseServiceLive.pipe(
  Layer.provide(AppConfigTestLayer),
);
