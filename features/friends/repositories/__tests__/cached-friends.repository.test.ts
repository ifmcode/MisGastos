import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { registerCurrentOwnerResolver } from "@/shared/lib/local-db/current-owner";
import { migrateLocalDatabase } from "@/shared/lib/local-db/database";
import { InMemoryDatabase } from "@/shared/lib/local-db/in-memory.database";
import {
  resetLocalDatabasePort,
  setLocalDatabasePort,
} from "@/shared/lib/local-db/local-db.runtime";

import { CachedFriendsRepository } from "../cached-friends.repository";
import type { IFriendsRepository } from "../friends.repository";
import {
  cacheFriendRequests,
  cacheFriendships,
  cachePublicProfiles,
  readCachedFriendRequests,
  readCachedFriendships,
} from "../local-friends.cache";

const OWNER = "user-a";
const NOW = "2026-11-26T10:00:00.000Z";

const friendship = {
  id: "user-a__user-b",
  memberIds: ["user-a", "user-b"],
  requesterId: "user-a",
  recipientId: "user-b",
  createdAt: NOW,
};

const request = {
  id: "user-a__user-c",
  requesterId: "user-a",
  recipientId: "user-c",
  participantIds: ["user-a", "user-c"],
  status: "pending" as const,
  createdAt: NOW,
  updatedAt: NOW,
};

const profile = {
  uid: "user-b",
  displayName: "B",
  email: "b@example.com",
  createdAt: NOW,
  updatedAt: NOW,
};

function remote(
  overrides: Partial<Record<keyof IFriendsRepository, unknown>> = {},
): IFriendsRepository & Record<string, jest.Mock> {
  return {
    ensurePublicProfile: jest.fn(),
    getPublicProfile: jest.fn(async () => null),
    getPublicProfiles: jest.fn(async () => []),
    findPublicProfileByEmail: jest.fn(async () => null),
    getFriendRequest: jest.fn(async () => null),
    getFriendRequests: jest.fn(async () => []),
    createFriendRequest: jest.fn(),
    updateFriendRequest: jest.fn(),
    deleteFriendRequest: jest.fn(),
    getFriendship: jest.fn(async () => null),
    getFriendships: jest.fn(async () => []),
    acceptFriendRequest: jest.fn(),
    deleteFriendship: jest.fn(),
    ...overrides,
  } as never;
}

describe("friends social cache", () => {
  let db: InMemoryDatabase;
  let previousFlag: string | undefined;

  beforeEach(async () => {
    previousFlag = process.env.EXPO_PUBLIC_OFFLINE_FIRST;
    process.env.EXPO_PUBLIC_OFFLINE_FIRST = "true";
    db = new InMemoryDatabase();
    await migrateLocalDatabase(db);
    setLocalDatabasePort(db);
    registerCurrentOwnerResolver(() => OWNER);
  });

  afterEach(() => {
    process.env.EXPO_PUBLIC_OFFLINE_FIRST = previousFlag;
    resetLocalDatabasePort();
    registerCurrentOwnerResolver(() => null);
  });

  it("mirrors and reads friendships and requests", async () => {
    await cacheFriendships(OWNER, [friendship], NOW);
    await cacheFriendRequests(OWNER, [request], NOW);

    await expect(readCachedFriendships(OWNER)).resolves.toEqual([friendship]);
    await expect(readCachedFriendRequests(OWNER)).resolves.toEqual([request]);
  });

  it("keeps the same social id isolated per account", async () => {
    await cacheFriendships(OWNER, [friendship], NOW);
    await cacheFriendships("user-z", [{ ...friendship, createdAt: "other" }], NOW);

    await expect(readCachedFriendships(OWNER)).resolves.toEqual([friendship]);
    await expect(readCachedFriendships("user-z")).resolves.toEqual([
      { ...friendship, createdAt: "other" },
    ]);
  });

  it("falls back to the cache when the remote list fails", async () => {
    await cacheFriendships(OWNER, [friendship], NOW);
    const repository = new CachedFriendsRepository(
      remote({
        getFriendships: jest.fn(async () => {
          throw new Error("offline");
        }),
      }),
    );

    await expect(repository.getFriendships(OWNER)).resolves.toEqual([friendship]);
  });

  it("returns no requests offline when nothing was cached", async () => {
    const repository = new CachedFriendsRepository(
      remote({
        getFriendRequests: jest.fn(async () => {
          throw new Error("offline");
        }),
      }),
    );

    await expect(repository.getFriendRequests(OWNER)).resolves.toEqual([]);
  });

  it("mirrors profiles and mutations", async () => {
    const repository = new CachedFriendsRepository(
      remote({
        getPublicProfiles: jest.fn(async () => [profile]),
        acceptFriendRequest: jest.fn(async () => friendship),
      }),
    );

    await expect(repository.getPublicProfiles(["user-b"])).resolves.toEqual([
      profile,
    ]);
    await repository.acceptFriendRequest(OWNER, request.id);

    await expect(
      new CachedFriendsRepository(
        remote({
          getFriendships: jest.fn(async () => {
            throw new Error("offline");
          }),
        }),
      ).getFriendships(OWNER),
    ).resolves.toEqual([friendship]);
  });

  it("falls back to cached single records", async () => {
    await cacheFriendships(OWNER, [friendship], NOW);
    await cacheFriendRequests(OWNER, [request], NOW);
    await cachePublicProfiles(OWNER, [profile], NOW);
    const repository = new CachedFriendsRepository(
      remote({
        getPublicProfile: jest.fn(async () => {
          throw new Error("offline");
        }),
        getFriendRequest: jest.fn(async () => {
          throw new Error("offline");
        }),
        getFriendship: jest.fn(async () => {
          throw new Error("offline");
        }),
      }),
    );

    await expect(repository.getPublicProfile("user-b")).resolves.toEqual(profile);
    await expect(repository.getFriendRequest(request.id)).resolves.toEqual(request);
    await expect(repository.getFriendship(friendship.id)).resolves.toEqual(friendship);
  });

  it("delegates every remaining operation and mirrors its result", async () => {
    const repository = new CachedFriendsRepository(
      remote({
        ensurePublicProfile: jest.fn(async () => profile),
        getPublicProfile: jest.fn(async () => profile),
        findPublicProfileByEmail: jest.fn(async () => profile),
        getFriendRequest: jest.fn(async () => request),
        createFriendRequest: jest.fn(async () => request),
        updateFriendRequest: jest.fn(async () => ({ ...request, status: "cancelled" })),
        deleteFriendRequest: jest.fn(async () => {}),
        getFriendship: jest.fn(async () => friendship),
        deleteFriendship: jest.fn(async () => {}),
      }),
    );

    await expect(repository.ensurePublicProfile({ uid: OWNER, displayName: "A", email: "a@x" })).resolves.toEqual(profile);
    await expect(repository.getPublicProfile("user-b")).resolves.toEqual(profile);
    await expect(repository.findPublicProfileByEmail("b@x")).resolves.toEqual(profile);
    await expect(repository.getFriendRequest("req")).resolves.toEqual(request);
    await expect(repository.createFriendRequest({} as never)).resolves.toEqual(request);
    await expect(repository.updateFriendRequest("req", {} as never)).resolves.toMatchObject({ status: "cancelled" });
    await expect(repository.getFriendship("user-a__user-b")).resolves.toEqual(friendship);
    await expect(repository.deleteFriendship("user-a__user-b")).resolves.toBeUndefined();
    await expect(repository.deleteFriendRequest("req")).resolves.toBeUndefined();
  });

  it("keeps the online behaviour when the flag is off", async () => {
    process.env.EXPO_PUBLIC_OFFLINE_FIRST = "false";
    const repository = new CachedFriendsRepository(
      remote({
        getFriendships: jest.fn(async () => {
          throw new Error("online error");
        }),
      }),
    );

    await expect(repository.getFriendships(OWNER)).rejects.toThrow("online error");
  });
});
