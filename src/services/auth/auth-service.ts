import type { MessageSendingResponse } from "postmark/dist/client/models";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { Context, Data, Effect, Layer } from "effect";
import { BindingsService } from "@/services/bindings/bindings-service";
import { DatabaseService } from "@/services/db/db-service";
import { KVService } from "@/services/kv/kv-service";
import { EmailService } from "../email/email-service";

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
  sendEmail: (to: string, subject: string, body: string) => Promise<MessageSendingResponse>;
};

function createAuthConfig({
  db,
  secondaryStorage,
  baseUrl,
  secret,
  googleProvider,
  sendEmail,
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
        user: {
          changeEmail: {
            enabled: true,
            sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
              void sendEmail(
                user.email,
                "From Juice - Confirm Email Change",
                `Click the following link to approve the change to ${newEmail}: ${url}`,
              );
            },
          },
        },
        emailAndPassword: {
          enabled: true,
          autoSignIn: true,
          sendResetPassword: async ({ user, url }) => {
            void sendEmail(
              user.email,
              "From Juice - Reset Password",
              `Click the following link to reset your password: ${url}`,
            );
          },

          // TODO
          // onPasswordReset: async ({ user }) => {
          //   // your logic here
          //   console.log(`Password for user ${user.email} has been reset.`);
          // },
        },
        emailVerification: {
          sendOnSignUp: true,
          autoSignInAfterVerification: true,
          sendVerificationEmail: async ({ user, url }) => {
            void sendEmail(
              user.email,
              "From Juice - Verify Email",
              `Click the following link to verify your email: ${url}`,
            );
          },
        },
        // 🚨 Make sure tanstackStart cookies is last plugin in array
        plugins: [tanstackStartCookies()],
        advanced: {
          database: {
            generateId: false,
          },
        },
        session: {
          cookieCache: {
            maxAge: 5 * 60, // 5 minutes (short-lived cookie)
            refreshCache: false, // Disable stateless refresh
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
    const kv = yield* KVService;
    const bindings = yield* BindingsService;
    const email = yield* EmailService;

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
      baseUrl: bindings.betterAuthUrl,
      secret: bindings.betterAuthSecret,
      googleProvider: {
        clientId: bindings.googleClientId,
        clientSecret: bindings.googleClientSecret,
      },
      // TODO: Email Templates
      sendEmail: (to, subject, body) => Effect.runPromise(email.sendEmail(to, subject, body)),

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
