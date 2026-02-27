import { Context, Data, Effect, Layer } from "effect";

class KVError extends Data.TaggedError("KVError")<{
  message?: string;
  readonly cause: unknown;
}> {}

export class KvService extends Context.Tag("KVService")<
  KvService,
  {
    readonly get: (key: string) => Effect.Effect<string | null, KVError>;
    readonly set: (key: string, value: string, ttl?: number) => Effect.Effect<void, KVError>;
    readonly delete: (key: string) => Effect.Effect<void, KVError>;
  }
>() {}

const MIN_TTL = 60;

function makeKvService(kv: KVNamespace<string>) {
  return Effect.succeed({
    get: (key: string) =>
      Effect.tryPromise({
        try: () => kv.get(key),
        catch: cause => new KVError({ message: `Failed to get key: ${key}`, cause }),
      }),

    set: (key: string, value: string, ttl?: number) =>
      Effect.tryPromise({
        try: () => {
          if (ttl !== undefined) {
            const safeTtl = Math.max(ttl, MIN_TTL);
            return kv.put(key, value, { expirationTtl: safeTtl });
          }
          return kv.put(key, value);
        },
        catch: cause => new KVError({ message: `Failed to set key: ${key}`, cause }),
      }),

    delete: (key: string) =>
      Effect.tryPromise({
        try: () => kv.delete(key),
        catch: cause => new KVError({ message: `Failed to delete key: ${key}`, cause }),
      }),
  });
}

// Cloudflare KV namespaces are Worker runtime bindings that only exist
// inside the Workers execution environment. They cannot be accessed from
// Node.js (where vitest runs). The @cloudflare/vitest-pool-workers package
// can simulate them via Miniflare, but currently only supports Vitest 2.x–3.x

// For now, we use an in-memory mock. Revisit when vitest-pool-workers
// supports Vitest 4.x.
const mockKV = {
  get: async () => null,
  put: async () => {},
  delete: async () => {},
} as unknown as KVNamespace<string>;

export const TestKvLayer = Layer.effect(
  KvService,
  makeKvService(mockKV),
);
