import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { KvService, TestKvLayer } from "./kv-service";

// KvService methods are thin pass-throughs to Cloudflare's KV API.
// We only verify the service wires up correctly — testing get/set/delete
// would just be testing Cloudflare's implementation, not ours.
describe("kvService", () => {
  it("builds the service successfully", async () => {
    const program = Effect.gen(function* () {
      const kv = yield* KvService;
      return kv;
    });

    const service = await Effect.runPromise(
      program.pipe(Effect.provide(TestKvLayer)),
    );

    expect(service).toBeDefined();
    expect(service.get).toBeDefined();
    expect(service.set).toBeDefined();
    expect(service.delete).toBeDefined();
  });
});
