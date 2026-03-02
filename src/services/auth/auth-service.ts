import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { Context, Data, Effect, Layer, Redacted } from "effect";
import { AppConfig } from "@/services/config/config-service";
import { DatabaseService } from "@/services/db/db-service";
import { KvService } from "@/services/kv/kv-service";

class AuthError extends Data.TaggedError("AuthError")<{
  message?: string;
  readonly cause: unknown;
}> {};

type DatabaseAdapter = NonNullable<Parameters<typeof betterAuth>[0]["database"]>;
type SecondaryStorage = NonNullable<Parameters<typeof betterAuth>[0]["secondaryStorage"]>;
type GoogleProvider = NonNullable<Parameters<typeof betterAuth>[0]["socialProviders"]>["google"];

type CreateAuthConfigParams = {
  db: DatabaseAdapter;
  secondaryStorage: SecondaryStorage;
  baseUrl: string;
  secret: string;
  googleProvider: GoogleProvider;
};

function createAuthConfig({
  db,
  secondaryStorage,
  baseUrl,
  secret,
  googleProvider,
}: CreateAuthConfigParams) {
  return Effect.try({
    try: () =>
      betterAuth({
        adapter: drizzleAdapter(db, {
          provider: "pg",
        }),
        baseUrl,
        secret,
        secondaryStorage,
        socialProviders: {
          google: googleProvider,
        },
        // 🚨 Make sure tanstackStart cookies is last plugin in array
        plugins: [tanstackStartCookies()],
        advanced: {
          database: {
            generateId: false,
          },
        },
        experimental: { joins: true },
      }),
    catch: error => new AuthError({ cause: error, message: "Failed to initialize auth" }),
  });
}

type Auth = Effect.Effect.Success<ReturnType<typeof createAuthConfig>>;

type GetSession = Auth["api"]["getSession"];
type GetSessionParams = Parameters<GetSession>[0];
type GetSessionResult = Awaited<ReturnType<GetSession>>;

export class AuthService extends Context.Tag("AuthService")<
  AuthService,
  {
    readonly auth: Auth;
    readonly getSession: (params: GetSessionParams) => Effect.Effect<
      GetSessionResult,
      AuthError
    >;
  }
>() {}

export const AuthServiceLive = Layer.effect(
  AuthService,
  Effect.gen(function* () {
    const { client } = yield* DatabaseService;
    const kv = yield* KvService;
    const config = yield* AppConfig;

    // Better Auth config requires the secondary storage functions
    // to return promises and not our cool effect code
    const secondaryStorage = {
      get: (key: string) => Effect.runPromise(kv.get(key)),
      set: (key: string, value: string, ttl?: number) => Effect.runPromise(kv.set(key, value, ttl)),
      delete: (key: string) => Effect.runPromise(kv.delete(key)),
    };

    const auth = yield* createAuthConfig({
      db: client,
      secondaryStorage,
      baseUrl: config.betterAuthUrl,
      secret: Redacted.value(config.betterAuthSecret),
      googleProvider: {
        clientId: config.googleClientId,
        clientSecret: Redacted.value(config.googleClientSecret),
      },
    });

    return {
      auth,
      getSession: (params: GetSessionParams) =>
        Effect.tryPromise({
          try: () => auth.api.getSession(params),
          catch: error => new AuthError({ cause: error, message: "Failed to get session" }),
        }),
    };
  }),
);
