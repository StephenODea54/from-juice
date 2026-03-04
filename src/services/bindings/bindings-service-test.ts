import { Layer } from "effect";
import { inject } from "vitest";
import { BindingsService } from "./bindings-service";

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
