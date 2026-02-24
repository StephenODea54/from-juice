import { describe, it, expect, inject } from "vitest";
import { Effect, Layer } from "effect";
import { sql } from "drizzle-orm";
import { DatabaseService, makeDatabaseService } from "./db-service";

const TestDbLayer = Layer.effect(
  DatabaseService,
  makeDatabaseService(inject("dbConnectionUri"))
);

describe("DatabaseService", () => {
  it("connects to the database", async () => {
    const program = Effect.gen(function* () {
      const { client } = yield* DatabaseService;
      const result = yield* Effect.tryPromise({
        try: () => client.execute(sql`SELECT 1`),
        catch: (cause) => new Error(`Query failed: ${cause}`),
      });
      return result.rows[0].value;
    });

    const value = await Effect.runPromise(
      program.pipe(Effect.provide(TestDbLayer))
    );

    expect(value).toBe(1);
  });
});
