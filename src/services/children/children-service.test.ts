import { eq } from "drizzle-orm";
import { Effect, Layer, Schema } from "effect";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { usersTable } from "@/services/auth/auth-schema";
import { BindingsServiceTest } from "@/services/bindings/bindings-service-test";
import { DatabaseService, DatabaseServiceLive, DatabaseServiceTestLayer } from "@/services/db/db-service";
import { childrenTable, CreateChildSchema } from "./children-schema";
import { ChildrenService, ChildrenServiceLive } from "./children-service";

const ChildrenServiceTestLayer = ChildrenServiceLive.pipe(
  Layer.provide(DatabaseServiceLive),
  Layer.provide(BindingsServiceTest),
);

describe("createChildSchema", () => {
  const decode = Schema.decodeUnknown(CreateChildSchema);

  const validBase = {
    parentId: "USR-123",
    name: "Walter",
    dateOfBirth: "2020-01-01",
    deliveryDate: null,
    deliveryEmail: null,
  };

  it("rejects a date of birth in the future", async () => {
    const error = await Effect.runPromise(
      decode({ ...validBase, dateOfBirth: "2030-01-01" }).pipe(Effect.flip),
    );

    expect(error._tag).toBe("ParseError");
  });

  it("rejects a delivery date in the past", async () => {
    const error = await Effect.runPromise(
      decode({ ...validBase, deliveryDate: "2020-06-01" }).pipe(Effect.flip),
    );

    expect(error._tag).toBe("ParseError");
  });

  it("rejects a delivery date before date of birth", async () => {
    const error = await Effect.runPromise(
      decode({ ...validBase, deliveryDate: "2019-01-01" }).pipe(Effect.flip),
    );

    expect(error._tag).toBe("ParseError");
  });
});

// TODO: Should add transaction support
// TODO: Should we use these from the auth service?
describe("childrenService", () => {
  let testUserId: string;

  beforeEach(async () => {
    testUserId = await Effect.runPromise(
      Effect.gen(function* () {
        const { client } = yield* DatabaseService;
        const [user] = yield* Effect.tryPromise({
          try: () =>
            client
              .insert(usersTable)
              .values({ name: "Test Parent", email: `test-${Date.now()}@blackhole.postmarkapp.com` })
              .returning(),
          catch: cause => new Error(`Failed to create test user: ${cause}`),
        });
        return user.id;
      }).pipe(Effect.provide(DatabaseServiceTestLayer)),
    );
  });

  afterEach(async () => {
    await Effect.runPromise(
      Effect.gen(function* () {
        const { client } = yield* DatabaseService;
        yield* Effect.tryPromise({
          try: () => client.delete(childrenTable).where(eq(childrenTable.parentId, testUserId)),
          catch: cause => new Error(`Cleanup failed: ${cause}`),
        });
        yield* Effect.tryPromise({
          try: () => client.delete(usersTable).where(eq(usersTable.id, testUserId)),
          catch: cause => new Error(`Cleanup failed: ${cause}`),
        });
      }).pipe(Effect.provide(DatabaseServiceTestLayer)),
    );
  });

  describe("readAll", () => {
    it("returns only non-archived children for the user", async () => {
      const program = Effect.gen(function* () {
        const { create, archive, readAll } = yield* ChildrenService;

        yield* create({ parentId: testUserId, name: "Walter", dateOfBirth: "2020-01-01", deliveryDate: null, deliveryEmail: null });
        yield* create({ parentId: testUserId, name: "Jesse", dateOfBirth: "2021-06-15", deliveryDate: null, deliveryEmail: null });
        const hank = yield* create({ parentId: testUserId, name: "Hank", dateOfBirth: "2019-03-10", deliveryDate: null, deliveryEmail: null });

        yield* archive(hank.id, testUserId);

        return yield* readAll(testUserId);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(ChildrenServiceTestLayer)),
      );

      expect(result).toHaveLength(2);
      expect(result.map(c => c.name)).toEqual(expect.arrayContaining(["Walter", "Jesse"]));
    });
  });

  describe("readOne", () => {
    it("returns the correct child", async () => {
      const program = Effect.gen(function* () {
        const { create, readOne } = yield* ChildrenService;
        const child = yield* create({ parentId: testUserId, name: "Skyler", dateOfBirth: "2020-01-01", deliveryDate: null, deliveryEmail: null });
        return yield* readOne(child.id, testUserId);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(ChildrenServiceTestLayer)),
      );

      expect(result.name).toBe("Skyler");
    });

    it("returns ChildNotFoundError when parentId does not match", async () => {
      const program = Effect.gen(function* () {
        const { create, readOne } = yield* ChildrenService;
        const child = yield* create({ parentId: testUserId, name: "Mike", dateOfBirth: "2020-01-01", deliveryDate: null, deliveryEmail: null });
        return yield* readOne(child.id, "other-user-id");
      });

      const error = await Effect.runPromise(
        program.pipe(Effect.provide(ChildrenServiceTestLayer), Effect.flip),
      );

      expect(error._tag).toBe("ChildNotFoundError");
    });

    it("returns ChildNotFoundError when child id does not exist", async () => {
      const program = Effect.gen(function* () {
        const { readOne } = yield* ChildrenService;
        return yield* readOne("CHD-does-not-exist", testUserId);
      });

      const error = await Effect.runPromise(
        program.pipe(Effect.provide(ChildrenServiceTestLayer), Effect.flip),
      );

      expect(error._tag).toBe("ChildNotFoundError");
    });
  });

  describe("update", () => {
    it("persists updated fields", async () => {
      const program = Effect.gen(function* () {
        const { create, update, readOne } = yield* ChildrenService;
        const child = yield* create({ parentId: testUserId, name: "Saul", dateOfBirth: "2020-01-01", deliveryDate: null, deliveryEmail: null });
        yield* update({ id: child.id, parentId: testUserId, name: "Jimmy" });
        return yield* readOne(child.id, testUserId);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(ChildrenServiceTestLayer)),
      );

      expect(result.name).toBe("Jimmy");
    });

    it("returns ChildNotFoundError when parentId does not match", async () => {
      const program = Effect.gen(function* () {
        const { create, update } = yield* ChildrenService;
        const child = yield* create({ parentId: testUserId, name: "Gus", dateOfBirth: "2020-01-01", deliveryDate: null, deliveryEmail: null });
        return yield* update({ id: child.id, parentId: "other-user-id", name: "Fring" });
      });

      const error = await Effect.runPromise(
        program.pipe(Effect.provide(ChildrenServiceTestLayer), Effect.flip),
      );

      expect(error._tag).toBe("ChildNotFoundError");
    });
  });

  describe("archive", () => {
    it("sets archived = true and archivedAt on the child", async () => {
      const program = Effect.gen(function* () {
        const { create, archive } = yield* ChildrenService;
        const todd = yield* create({ parentId: testUserId, name: "Todd", dateOfBirth: "2020-01-01", deliveryDate: null, deliveryEmail: null });
        yield* create({ parentId: testUserId, name: "Lydia", dateOfBirth: "2021-06-15", deliveryDate: null, deliveryEmail: null });
        return yield* archive(todd.id, testUserId);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(ChildrenServiceTestLayer)),
      );

      expect(result.archived).toBe(true);
      expect(result.archivedAt).not.toBeNull();
    });

    it("returns LastChildError when archiving the only non-archived child", async () => {
      const program = Effect.gen(function* () {
        const { create, archive } = yield* ChildrenService;
        const tuco = yield* create({ parentId: testUserId, name: "Tuco", dateOfBirth: "2020-01-01", deliveryDate: null, deliveryEmail: null });
        return yield* archive(tuco.id, testUserId);
      });

      const error = await Effect.runPromise(
        program.pipe(Effect.provide(ChildrenServiceTestLayer), Effect.flip),
      );

      expect(error._tag).toBe("LastChildError");
    });

    it("returns ChildNotFoundError when parentId does not match", async () => {
      const program = Effect.gen(function* () {
        const { create, archive } = yield* ChildrenService;
        const child = yield* create({ parentId: testUserId, name: "Badger", dateOfBirth: "2020-01-01", deliveryDate: null, deliveryEmail: null });
        return yield* archive(child.id, "other-user-id");
      });

      const error = await Effect.runPromise(
        program.pipe(Effect.provide(ChildrenServiceTestLayer), Effect.flip),
      );

      expect(error._tag).toBe("ChildNotFoundError");
    });
  });

  describe("create", () => {
    it("returns a child with the correct parentId and defaults", async () => {
      const program = Effect.gen(function* () {
        const { create } = yield* ChildrenService;
        return yield* create({
          parentId: testUserId,
          name: "Flynn",
          dateOfBirth: "2020-01-01",
          deliveryDate: null,
          deliveryEmail: null,
        });
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(ChildrenServiceTestLayer)),
      );

      expect(result.id).toMatch(/^CHD-/);
      expect(result.parentId).toBe(testUserId);
      expect(result.name).toBe("Flynn");
      expect(result.dateOfBirth).toBe("2020-01-01");
      expect(result.archived).toBe(false);
      expect(result.archivedAt).toBeNull();
    });
  });
});
