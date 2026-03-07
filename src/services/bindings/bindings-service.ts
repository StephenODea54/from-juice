import { Context } from "effect";

// TODO: Should we make this effect schema?
type Bindings = {
  betterAuthSecret: string;
  betterAuthUrl: string;
  googleClientId: string;
  googleClientSecret: string;
  dbConnectionUri: string;
  kv: KVNamespace;
  postmarkApiKey: string;
};

export class BindingsService extends Context.Tag("BindingsService")<
  BindingsService,
  Bindings
>() {}
