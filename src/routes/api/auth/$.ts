import { createFileRoute } from "@tanstack/react-router";
import { Effect } from "effect";
import { AuthService, AuthServiceLive } from "@/services/auth/auth-service";
import { BindingsServiceLive } from "@/services/bindings/bindings-service-live";
import { DatabaseServiceLive } from "@/services/db/db-service";
import { KVServiceLive } from "@/services/kv/kv-service";

async function handleAuth(request: Request) {
  const program = Effect.gen(function* () {
    const { auth } = yield* AuthService;
    return auth.handler(request);
  });

  return Effect.runPromise(
    program.pipe(
      Effect.provide(AuthServiceLive),
      Effect.provide(DatabaseServiceLive),
      Effect.provide(KVServiceLive),
      Effect.provide(BindingsServiceLive),
    ),
  );
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => handleAuth(request),
      POST: ({ request }) => handleAuth(request),
    },
  },
});
