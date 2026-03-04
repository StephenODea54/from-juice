import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { BindingsServiceTest } from "@/services/bindings/bindings-service";
import { KVServiceLive } from "@/services/kv/kv-service";
import { DatabaseServiceLive } from "../db/db-service";
import { AuthService, AuthServiceLive } from "./auth-service";

describe("authService", () => {
  it("creates the auth config successfully", async () => {
    const program = Effect.gen(function* () {
      const { auth } = yield* AuthService;
      return auth;
    });

    const auth = await Effect.runPromise(
      program.pipe(
        Effect.provide(AuthServiceLive),
        Effect.provide(DatabaseServiceLive),
        Effect.provide(KVServiceLive),
        Effect.provide(BindingsServiceTest),
      ),
    );

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
      program.pipe(
        Effect.provide(AuthServiceLive),
        Effect.provide(DatabaseServiceLive),
        Effect.provide(KVServiceLive),
        Effect.provide(BindingsServiceTest),
      ),
    );

    expect(session).toBeNull();
  });
});
