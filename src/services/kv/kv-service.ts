import { Context, Data, Effect, Layer } from "effect";
import { BindingsService } from "@/services/bindings/bindings-service";

class KVError extends Data.TaggedError("KVError")<{
  message?: string;
  readonly cause: unknown;
}> {}

export class KVService extends Context.Tag("KVService")<
  KVService,
  {
    readonly get: (key: string) => Effect.Effect<string | null, KVError>;
    readonly set: (key: string, value: string, ttl?: number) => Effect.Effect<void, KVError>;
    readonly delete: (key: string) => Effect.Effect<void, KVError>;
  }
>() {}

const MIN_TTL = 60;

export const KVServiceLive = Layer.effect(
  KVService,
  Effect.gen(function* () {
    const { kv } = yield* BindingsService;

    return {
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
    };
  }),
);
