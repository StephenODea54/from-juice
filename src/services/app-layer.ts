import { Layer } from "effect";
import { AuthServiceLive } from "@/services/auth/auth-service";
import { DatabaseServiceLive } from "@/services/db/db-service";
import { KVServiceLive } from "@/services/kv/kv-service";
import { BindingsServiceLive } from "./bindings/bindings-service-live";

export const AppLayer = AuthServiceLive.pipe(
  Layer.provide(DatabaseServiceLive),
  Layer.provide(KVServiceLive),
  Layer.provide(BindingsServiceLive),
);
