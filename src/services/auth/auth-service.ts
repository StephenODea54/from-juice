import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Context, Data, Effect, Layer } from "effect";
import { DatabaseService } from "@/services/db/db-service";

class AuthError extends Data.TaggedError("AuthError")<{
  message?: string;
  readonly cause: unknown;
}> {};

type DrizzleClient = Parameters<typeof drizzleAdapter>[0];
function createAuthConfig(db: DrizzleClient, baseUrl: string, secret: string) {
  return Effect.try({
    try: () =>
      betterAuth({
        adapter: drizzleAdapter(db, {
          provider: "pg",
        }),
        baseUrl,
        secret,
        experimental: { joins: true },
      }),
    catch: error => new AuthError({ cause: error, message: "Failed to initialize auth" }),
  });
}

type Auth = Effect.Effect.Success<ReturnType<typeof createAuthConfig>>;

type GetSession = Auth["api"]["getSession"];
type GetSessionParams = Parameters<GetSession>;
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
    const auth = yield* createAuthConfig(client, "yo", "momma");

    return {
      auth,
      getSession: (params: GetSessionParams) =>
        Effect.tryPromise({
          try: () => auth.api.getSession(...params),
          catch: error => new AuthError({ cause: error, message: "Failed to get session" }),
        }),
    };
  }),
);
