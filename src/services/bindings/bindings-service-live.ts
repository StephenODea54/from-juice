import { env } from "cloudflare:workers";
import { Layer } from "effect";
import { BindingsService } from "./bindings-service";

export const BindingsServiceLive = Layer.sync(
  BindingsService,
  () => ({
    betterAuthSecret: env.BETTER_AUTH_SECRET,
    betterAuthUrl: env.BETTER_AUTH_URL,
    dbConnectionUri: env.DB_CONNECTION_URI,
    googleClientId: env.GOOGLE_CLIENT_ID,
    googleClientSecret: env.GOOGLE_CLIENT_SECRET,
    kv: env.KV_NAMESPACE,
    postmarkApiKey: env.POSTMARK_API_KEY,
  }),
);
