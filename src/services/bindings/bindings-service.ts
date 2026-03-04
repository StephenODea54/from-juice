// import { env } from "cloudflare:workers";
import { Context, Layer } from "effect";
import { inject } from "vitest";

// TODO: Should we make this effect schema?
type Bindings = {
  betterAuthSecret: string;
  betterAuthUrl: string;
  googleClientId: string;
  googleClientSecret: string;
  dbConnectionUri: string;
  kv: KVNamespace;
};

export class BindingsService extends Context.Tag("BindingsService")<
  BindingsService,
  Bindings
>() {}

// export const BindingsServiceLive = Layer.sync(
//   BindingsService,
//   () => ({
//     betterAuthSecret: env.BETTER_AUTH_SECRET,
//     betterAuthUrl: env.BETTER_AUTH_URL,
//     dbConnectionUri: env.DB_CONNECTION_URI,
//     googleClientId: env.GOOGLE_CLIENT_ID,
//     googleClientSecret: env.GOOGLE_CLIENT_SECRET,
//     kv: env.KV_NAMESPACE,
//   }),
// );

export const BindingsServiceTest = Layer.sync(
  BindingsService,
  () => ({
    betterAuthSecret: inject("betterAuthSecret"),
    betterAuthUrl: inject("betterAuthUrl"),
    dbConnectionUri: inject("dbConnectionUri"),
    googleClientId: inject("googleClientId"),
    googleClientSecret: inject("googleClientSecret"),
    kv: new Map() as unknown as KVNamespace,
  }),
);
