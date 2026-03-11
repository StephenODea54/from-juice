import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { KVServiceLive } from "@/services/kv/kv-service";
import { BindingsServiceTest } from "../bindings/bindings-service-test";
import { DatabaseServiceLive } from "../db/db-service";
import { EmailServiceLive } from "../email/email-service";
import { AuthError, AuthService, AuthServiceLive } from "./auth-service";

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

  it("signup creates user with correct defaults", async () => {
    const program = Effect.gen(function* () {
      const { auth } = yield* AuthService;

      return yield* Effect.tryPromise({
        try: () => auth.api.signUpEmail({
          body: {
            name: "Test User",
            email: `test-${Date.now()}@blackhole.postmarkapp.com`,
            password: "password123456",
          },
          headers: new Headers(),
        }),
        catch: (cause) => {
          console.error("🚨🚨🚨🚨🚨");
          console.error(cause);
          return new AuthError({ cause, message: "Signup failed" });
        },
      });
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(AuthServiceTestLayer)),
    );

    expect(result.user.isOnboardingComplete).toBe(false);
    expect(result.user.isArchived).toBe(false);
  });
});
