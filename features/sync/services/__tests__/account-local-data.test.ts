import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { InMemoryDatabase } from "@/shared/lib/local-db/in-memory.database";
import {
  resetLocalDatabasePort,
  setLocalDatabasePort,
} from "@/shared/lib/local-db/local-db.runtime";
import {
  allowOwnerLocalWrites,
  isOwnerLocalWritesRevoked,
} from "@/shared/lib/local-db/owner-revocation";

import {
  createFailingPort,
  OTHER,
  OWNER,
  seedRows,
} from "./account-local-data.fixtures";

const mockWhenIdle = jest.fn<(ownerId: string) => Promise<void>>(
  async () => undefined,
);
const mockGetSyncEngine = jest.fn(() => ({ whenIdle: mockWhenIdle }));

jest.mock("../sync-engine.factory", () => ({
  getSyncEngine: () => mockGetSyncEngine(),
}));

import {
  purgeAccountLocalData,
  purgeLocalAccountOnLogout,
} from "../account-local-data";

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  resetLocalDatabasePort();
  allowOwnerLocalWrites(OWNER);
  allowOwnerLocalWrites(OTHER);
});

describe("purgeAccountLocalData", () => {
  it("returns false without a local database and never starts the engine", async () => {
    setLocalDatabasePort(null);

    await expect(purgeAccountLocalData(OWNER)).resolves.toBe(false);

    expect(mockGetSyncEngine).not.toHaveBeenCalled();
    expect(isOwnerLocalWritesRevoked(OWNER)).toBe(false);
  });

  it("waits for the sync cycle, deletes the account rows and keeps the revocation", async () => {
    const db = new InMemoryDatabase();
    setLocalDatabasePort(db);
    seedRows(db);

    await expect(purgeAccountLocalData(OWNER)).resolves.toBe(true);

    expect(mockGetSyncEngine).toHaveBeenCalledTimes(1);
    expect(mockWhenIdle).toHaveBeenCalledWith(OWNER);
    await expect(db.count("wallets", { ownerId: OWNER })).resolves.toBe(0);
    await expect(db.count("outboxSeq", { ownerId: OWNER })).resolves.toBe(0);
    await expect(db.count("wallets", { ownerId: OTHER })).resolves.toBe(1);
    await expect(db.count("outboxSeq", { ownerId: OTHER })).resolves.toBe(1);
    expect(isOwnerLocalWritesRevoked(OWNER)).toBe(true);
  });
});

describe("purgeLocalAccountOnLogout", () => {
  it("does nothing without an owner", async () => {
    const db = new InMemoryDatabase();
    setLocalDatabasePort(db);
    seedRows(db);

    await expect(purgeLocalAccountOnLogout(null)).resolves.toBeUndefined();

    expect(mockGetSyncEngine).not.toHaveBeenCalled();
    await expect(db.count("wallets", { ownerId: OWNER })).resolves.toBe(1);
  });

  it("logs the stable code and resolves when the purge fails", async () => {
    setLocalDatabasePort(createFailingPort(new InMemoryDatabase()));
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);

    await expect(purgeLocalAccountOnLogout(OWNER)).resolves.toBeUndefined();

    expect(warn).toHaveBeenCalledWith("[local-db] OWNER_PURGE_FAILED");
    warn.mockRestore();
  });

  it("purges the owner after a normal logout call", async () => {
    const db = new InMemoryDatabase();
    setLocalDatabasePort(db);
    seedRows(db);

    await purgeLocalAccountOnLogout(OWNER);

    await expect(db.count("wallets", { ownerId: OWNER })).resolves.toBe(0);
    expect(isOwnerLocalWritesRevoked(OWNER)).toBe(true);
  });

  it("revokes the owner even when the sync wait rejects", async () => {
    const db = new InMemoryDatabase();
    setLocalDatabasePort(db);
    seedRows(db);
    mockWhenIdle.mockRejectedValueOnce(new Error("cycle failed"));
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);

    await expect(purgeLocalAccountOnLogout(OWNER)).resolves.toBeUndefined();

    expect(warn).toHaveBeenCalledWith("[local-db] OWNER_PURGE_FAILED");
    expect(isOwnerLocalWritesRevoked(OWNER)).toBe(true);
    warn.mockRestore();
  });
});
