import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { migrateLocalDatabase } from "@/shared/lib/local-db/database";
import { InMemoryDatabase } from "@/shared/lib/local-db/in-memory.database";
import {
  resetLocalDatabasePort,
  setLocalDatabasePort,
} from "@/shared/lib/local-db/local-db.runtime";
import { NOW } from "@/shared/lib/local-db/__tests__/outbox.fixtures";

import {
  cacheCategories,
  readCachedCategories,
} from "../local-category.cache";
import { buildCategory, LOCAL_TEST_OWNER } from "./local-category.fixtures";

const FLAG = "EXPO_PUBLIC_OFFLINE_FIRST";
let previousFlag: string | undefined;

describe("categories local cache", () => {
  let db: InMemoryDatabase;

  beforeEach(async () => {
    previousFlag = process.env[FLAG];
    process.env[FLAG] = "true";
    db = new InMemoryDatabase();
    await migrateLocalDatabase(db);
    setLocalDatabasePort(db);
  });

  afterEach(() => {
    resetLocalDatabasePort();
    jest.restoreAllMocks();

    if (previousFlag === undefined) {
      delete process.env[FLAG];
    } else {
      process.env[FLAG] = previousFlag;
    }
  });

  it("returns null for a cold cache", async () => {
    await expect(readCachedCategories(LOCAL_TEST_OWNER)).resolves.toBeNull();
  });

  it("returns an empty list for a fetched but empty collection", async () => {
    await cacheCategories(LOCAL_TEST_OWNER, [], NOW);

    await expect(readCachedCategories(LOCAL_TEST_OWNER)).resolves.toEqual([]);
  });

  it("round-trips a legacy category without sortOrder as undefined", async () => {
    const legacy = buildCategory({ sortOrder: undefined });

    await cacheCategories(LOCAL_TEST_OWNER, [legacy], NOW);

    const cached = await readCachedCategories(LOCAL_TEST_OWNER);
    expect(cached).toEqual([legacy]);
    expect(cached?.[0]?.sortOrder).toBeUndefined();
  });

  it("returns the cached categories in canonical order", async () => {
    const first = buildCategory({ id: "category-1", sortOrder: 3 });
    const second = buildCategory({ id: "category-2", sortOrder: 1 });

    await cacheCategories(LOCAL_TEST_OWNER, [first, second], NOW);

    const cached = await readCachedCategories(LOCAL_TEST_OWNER);
    expect(cached?.map((category) => category.id)).toEqual([
      "category-2",
      "category-1",
    ]);
  });

  it("skips a stored row the category mapper rejects", async () => {
    await cacheCategories(LOCAL_TEST_OWNER, [buildCategory()], NOW);
    await db.upsert("categories", {
      id: "invalid",
      ownerId: LOCAL_TEST_OWNER,
      name: "Comida",
      type: "other",
    });

    const cached = await readCachedCategories(LOCAL_TEST_OWNER);
    expect(cached?.map((category) => category.id)).toEqual(["category-1"]);
  });

  it("removes rows missing from the next remote list", async () => {
    const first = buildCategory({ id: "category-1" });
    const second = buildCategory({ id: "category-2", name: "Ocio" });

    await cacheCategories(LOCAL_TEST_OWNER, [first, second], NOW);
    await cacheCategories(LOCAL_TEST_OWNER, [second], NOW);

    const cached = await readCachedCategories(LOCAL_TEST_OWNER);
    expect(cached?.map((category) => category.id)).toEqual(["category-2"]);
  });

  it("returns null when the local read throws", async () => {
    jest.spyOn(db, "select").mockRejectedValueOnce(new Error("read failed"));

    await expect(readCachedCategories(LOCAL_TEST_OWNER)).resolves.toBeNull();
  });

  it("does not read or write when the flag is off", async () => {
    process.env[FLAG] = "false";

    await expect(readCachedCategories(LOCAL_TEST_OWNER)).resolves.toBeNull();
    await cacheCategories(LOCAL_TEST_OWNER, [buildCategory()], NOW);

    await expect(db.count("categories")).resolves.toBe(0);
    await expect(db.count("cacheMeta")).resolves.toBe(0);
  });

  it("returns null and writes nothing without a database port", async () => {
    setLocalDatabasePort(null);

    await expect(readCachedCategories(LOCAL_TEST_OWNER)).resolves.toBeNull();
    await cacheCategories(LOCAL_TEST_OWNER, [buildCategory()], NOW);

    await expect(db.count("categories")).resolves.toBe(0);
  });
});
