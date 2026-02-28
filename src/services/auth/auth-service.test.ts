import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { TestDbLayer } from "@/services/db/db-service";
import { TestKvLayer } from "@/services/kv/kv-service";
import { AuthService, AuthServiceLive } from "./auth-service";

const TestAuthLayer = AuthServiceLive.pipe(
  Layer.provide(TestDbLayer),
  Layer.provide(TestKvLayer),
);

describe("authService", () => {
  it("creates the auth config successfully", async () => {
    const program = Effect.gen(function* () {
      const { auth } = yield* AuthService;
      return auth;
    });

    const auth = await Effect.runPromise(program.pipe(Effect.provide(TestAuthLayer), Effect.provide(TestKvLayer)));

    expect(auth).toBeDefined();
  });

  it("getSession returns null when no session exists", async () => {
    const program = Effect.gen(function* () {
      const { getSession } = yield* AuthService;

      return yield* getSession({
        headers: new Headers(),
      });
    });

    const session = await Effect.runPromise(
      program.pipe(Effect.provide(TestAuthLayer)),
    );

    expect(session).toBeNull();
  });
});
