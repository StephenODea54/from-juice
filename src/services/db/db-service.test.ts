import { sql } from "drizzle-orm";
import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { BindingsServiceTest } from "@/services/bindings/bindings-service";
import { DatabaseService, DatabaseServiceLive } from "./db-service";

describe("databaseService", () => {
  it("connects to the database", async () => {
    const program = Effect.gen(function* () {
      const { client } = yield* DatabaseService;
      const result = yield* Effect.tryPromise({
        try: () => client.execute(sql`SELECT 1 AS yo_momma`),
        catch: cause => new Error(`Query failed: ${cause}`),
      });

      return result.rows[0].yo_momma;
    });

    const value = await Effect.runPromise(
      program.pipe(
        Effect.provide(DatabaseServiceLive),
        Effect.provide(BindingsServiceTest),
      ),
    );

    expect(value).toBe(1);
  });
});
