import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { registerCurrentOwnerResolver } from "@/shared/lib/local-db/current-owner";
import { migrateLocalDatabase } from "@/shared/lib/local-db/database";
import { InMemoryDatabase } from "@/shared/lib/local-db/in-memory.database";
import {
  resetLocalDatabasePort,
  setLocalDatabasePort,
} from "@/shared/lib/local-db/local-db.runtime";

import { CachedGroupsRepository } from "../cached-groups.repository";
import type { IGroupsRepository } from "../groups.repository";
import {
  cacheGroupInvitations,
  cacheGroups,
  cachePendingInvitations,
  readCachedGroupInvitations,
  readCachedGroups,
  readCachedPendingInvitations,
} from "../local-groups.cache";

const OWNER = "user-a";
const NOW = "2026-11-26T10:00:00.000Z";
const GROUP_ID = "user-a__group-1";

const group = {
  id: GROUP_ID,
  ownerId: OWNER,
  createdBy: OWNER,
  memberIds: [OWNER, "user-b"],
  name: "Trip",
  description: null,
  defaultCurrency: "EUR" as const,
  joinCode: "ABCD2345",
  simplifyDebts: true,
  createdAt: NOW,
  updatedAt: NOW,
};

const invitation = {
  id: `${GROUP_ID}__user-c`,
  groupId: GROUP_ID,
  groupName: "Trip",
  inviterId: OWNER,
  inviteeId: "user-c",
  pairId: "user-a__user-c",
  status: "pending" as const,
  createdAt: NOW,
  updatedAt: NOW,
};

function remote(
  overrides: Partial<Record<keyof IGroupsRepository, unknown>> = {},
): IGroupsRepository & Record<string, jest.Mock> {
  return {
    createGroupWithInvitations: jest.fn(),
    getGroups: jest.fn(async () => []),
    getGroup: jest.fn(async () => null),
    updateGroup: jest.fn(),
    removeMember: jest.fn(),
    leaveGroup: jest.fn(),
    transferOwnership: jest.fn(),
    getGroupActivity: jest.fn(),
    getGroupInvitation: jest.fn(async () => null),
    getGroupInvitations: jest.fn(async () => []),
    getPendingInvitations: jest.fn(async () => []),
    inviteMembers: jest.fn(),
    acceptInvitation: jest.fn(),
    rejectInvitation: jest.fn(),
    cancelInvitation: jest.fn(),
    getGroupCode: jest.fn(async () => null),
    getGroupJoinRequest: jest.fn(async () => null),
    getGroupJoinRequests: jest.fn(async () => []),
    createGroupJoinRequest: jest.fn(),
    respondToGroupJoinRequest: jest.fn(),
    ensureGroupJoinCode: jest.fn(),
    ...overrides,
  } as never;
}

describe("groups social cache", () => {
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

  it("mirrors groups and invitations", async () => {
    await cacheGroups(OWNER, [group], NOW);
    await cacheGroupInvitations(OWNER, GROUP_ID, [invitation], NOW);

    await expect(readCachedGroups(OWNER)).resolves.toEqual([group]);
    await expect(
      readCachedGroupInvitations(OWNER, GROUP_ID),
    ).resolves.toEqual([invitation]);
  });

  it("mirrors and reads the pending invitations of an invitee", async () => {
    await cachePendingInvitations(OWNER, "user-c", [invitation], NOW);

    await expect(
      readCachedPendingInvitations(OWNER, "user-c"),
    ).resolves.toEqual([invitation]);
  });

  it("falls back to the cache for the list, one group and invitations", async () => {
    await cacheGroups(OWNER, [group], NOW);
    await cacheGroupInvitations(OWNER, GROUP_ID, [invitation], NOW);
    const repository = new CachedGroupsRepository(
      remote({
        getGroups: jest.fn(async () => {
          throw new Error("offline");
        }),
        getGroup: jest.fn(async () => {
          throw new Error("offline");
        }),
        getGroupInvitations: jest.fn(async () => {
          throw new Error("offline");
        }),
      }),
    );

    await expect(repository.getGroups(OWNER)).resolves.toEqual([group]);
    await expect(repository.getGroup(GROUP_ID)).resolves.toEqual(group);
    await expect(repository.getGroupInvitations(GROUP_ID)).resolves.toEqual([
      invitation,
    ]);
  });

  it("returns empty invitations offline when nothing was cached", async () => {
    const repository = new CachedGroupsRepository(
      remote({
        getGroupInvitations: jest.fn(async () => {
          throw new Error("offline");
        }),
        getPendingInvitations: jest.fn(async () => {
          throw new Error("offline");
        }),
      }),
    );

    await expect(repository.getGroupInvitations(GROUP_ID)).resolves.toEqual([]);
    await expect(repository.getPendingInvitations("user-c")).resolves.toEqual([]);
  });

  it("mirrors a group mutation for the offline read", async () => {
    const updated = { ...group, name: "New name" };
    const repository = new CachedGroupsRepository(
      remote({ updateGroup: jest.fn(async () => updated) }),
    );

    await repository.updateGroup(OWNER, GROUP_ID, {
      name: "New name",
      description: null,
      defaultCurrency: "EUR",
      simplifyDebts: true,
      updatedAt: NOW,
    });

    await expect(
      new CachedGroupsRepository(
        remote({
          getGroups: jest.fn(async () => {
            throw new Error("offline");
          }),
        }),
      ).getGroups(OWNER),
    ).resolves.toEqual([updated]);
  });

  it("falls back to cached pending invitations", async () => {
    await cachePendingInvitations(OWNER, "user-c", [invitation], NOW);
    const repository = new CachedGroupsRepository(
      remote({
        getPendingInvitations: jest.fn(async () => {
          throw new Error("offline");
        }),
      }),
    );

    await expect(
      repository.getPendingInvitations("user-c"),
    ).resolves.toEqual([invitation]);
  });

  it("mirrors every group mutation", async () => {
    const joinRequest = { id: "join-1" };
    const repository = new CachedGroupsRepository(
      remote({
        createGroupWithInvitations: jest.fn(async () => ({
          group,
          invitations: [invitation],
        })),
        removeMember: jest.fn(async () => group),
        leaveGroup: jest.fn(async () => group),
        transferOwnership: jest.fn(async () => group),
        inviteMembers: jest.fn(async () => [invitation]),
        acceptInvitation: jest.fn(async () => group),
        rejectInvitation: jest.fn(async () => invitation),
        cancelInvitation: jest.fn(async () => invitation),
        createGroupJoinRequest: jest.fn(async () => joinRequest),
        respondToGroupJoinRequest: jest.fn(async () => ({
          group,
          request: joinRequest,
        })),
        ensureGroupJoinCode: jest.fn(async () => group),
        getGroupInvitation: jest.fn(async () => invitation),
        getGroupActivity: jest.fn(async () => ({ items: [], nextCursor: null })),
        getGroupCode: jest.fn(async () => ({ code: "ABCD2345" })),
        getGroupJoinRequest: jest.fn(async () => joinRequest),
        getGroupJoinRequests: jest.fn(async () => [joinRequest]),
      }),
    );

    await repository.createGroupWithInvitations({} as never);
    await repository.removeMember({} as never);
    await repository.leaveGroup({} as never);
    await repository.transferOwnership({} as never);
    await expect(repository.inviteMembers({} as never)).resolves.toEqual([invitation]);
    await repository.acceptInvitation(OWNER, invitation.id);
    await expect(repository.rejectInvitation(invitation.id, NOW)).resolves.toEqual(invitation);
    await expect(repository.cancelInvitation(invitation.id, NOW)).resolves.toEqual(invitation);
    await expect(repository.createGroupJoinRequest({} as never)).resolves.toEqual(joinRequest);
    await repository.respondToGroupJoinRequest({} as never);
    await repository.ensureGroupJoinCode({} as never);
    await expect(repository.getGroupInvitation(invitation.id)).resolves.toEqual(invitation);
    await repository.getGroupActivity(GROUP_ID);
    await repository.getGroupCode("ABCD2345");
    await repository.getGroupJoinRequest("join-1");
    await repository.getGroupJoinRequests(GROUP_ID);
  });
});
