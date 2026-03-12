import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { Effect } from "effect";
import { AppLayer } from "@/services/app-layer";
import { AuthService } from "@/services/auth/auth-service";

export const getSession = createServerFn({ method: "GET" }).handler(async () => {
  const headers = getRequestHeaders();

  const program = Effect.gen(function* () {
    const { getSession } = yield* AuthService;
    return yield* getSession({ headers });
  });

  return Effect.runPromise(program.pipe(Effect.provide(AppLayer)));
});

export const ensureSession = createServerFn({ method: "GET" }).handler(async () => {
  const headers = getRequestHeaders();

  const program = Effect.gen(function* () {
    const { getSession } = yield* AuthService;
    const session = yield* getSession({ headers });

    if (!session) {
      throw new Error("Unauthorized");
    }

    return session;
  });

  return Effect.runPromise(program.pipe(Effect.provide(AppLayer)));
});
