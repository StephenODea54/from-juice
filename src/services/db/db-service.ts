import { drizzle } from "drizzle-orm/neon-http";
import { Context, Data, Effect } from "effect";

class DatabaseConnectionError extends Data.TaggedError("DatabaseConnectionError")<{
  message?: string;
  readonly cause: unknown;
}> {}

type DatabaseClient = ReturnType<typeof drizzle>;

export class DatabaseService extends Context.Tag("DatabaseService")<
  DatabaseService,
  { readonly client: DatabaseClient }
>() {}

export function makeDatabaseService(connectionUri: string) {
  return Effect.try({
    try: () => ({
      // TODO: Add schema
      client: drizzle(connectionUri, { casing: "snake_case" }),
    }),
    catch: cause =>
      new DatabaseConnectionError({
        message: "Failed to establish a connection to the database",
        cause,
      }),
  });
}
