import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { KVServiceLive } from "@/services/kv/kv-service";
import { BindingsServiceTest } from "../bindings/bindings-service-test";
import { DatabaseServiceLive } from "../db/db-service";
import { EmailServiceLive } from "../email/email-service";
import { AuthService, AuthServiceLive } from "./auth-service";

const AuthServiceTestLayer = AuthServiceLive.pipe(
  Layer.provide(DatabaseServiceLive),
  Layer.provide(KVServiceLive),
  Layer.provide(EmailServiceLive),
  Layer.provide(BindingsServiceTest),
);

describe("authService", () => {
  it("creates the auth config successfully", async () => {
    const program = Effect.gen(function* () {
      const { auth } = yield* AuthService;
      return auth;
    });

    const auth = await Effect.runPromise(
      program.pipe(
        Effect.provide(AuthServiceTestLayer),
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
        Effect.provide(AuthServiceTestLayer),
      ),
    );

    expect(session).toBeNull();
  });
});
