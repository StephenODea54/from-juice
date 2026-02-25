import { sql } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { describe, expect, inject, it } from "vitest";
import { DatabaseService, makeDatabaseService } from "./db-service";

const TestDbLayer = Layer.effect(
  DatabaseService,
  makeDatabaseService(inject("dbConnectionUri")),
);

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
      program.pipe(Effect.provide(TestDbLayer)),
    );

    expect(value).toBe(1);
  });
});
