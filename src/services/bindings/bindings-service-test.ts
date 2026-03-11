import { Layer } from "effect";
import { inject } from "vitest";
import { BindingsService } from "./bindings-service";

// TODO: Is there a way to inject the kv namespace from alchemy?
const mockKV = {
  get: async () => null,
  put: async () => {},
  delete: async () => {},
  list: async () => ({ keys: [], list_complete: true, cacheStatus: null }),
  getWithMetadata: async () => ({ value: null, metadata: null, cacheStatus: null }),
} as unknown as KVNamespace;

export const BindingsServiceTest = Layer.sync(
  BindingsService,
  () => ({
    betterAuthSecret: inject("betterAuthSecret"),
    betterAuthUrl: inject("betterAuthUrl"),
    dbConnectionUri: inject("dbConnectionUri"),
    googleClientId: inject("googleClientId"),
    googleClientSecret: inject("googleClientSecret"),
    kv: mockKV,
    postmarkApiKey: inject("postmarkApiKey"),
  }),
);
