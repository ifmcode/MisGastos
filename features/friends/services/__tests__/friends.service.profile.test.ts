import { describe, expect, it } from "@jest/globals";

import { FriendValidationError } from "../friend.errors";
import { FriendsService } from "../friends.service";
import {
  FakeFriendLedgerRepository,
  FakeFriendsRepository,
} from "./friends-service.fakes";

function createService() {
  const repository = new FakeFriendsRepository();
  const ledger = new FakeFriendLedgerRepository();

  return { repository, service: new FriendsService(repository, ledger) };
}

describe("FriendsService.ensurePublicProfile", () => {
  it("normalizes the identity before writing it", async () => {
    const { repository, service } = createService();

    const profile = await service.ensurePublicProfile({
      uid: " user-1 ",
      displayName: "  Ada Lovelace ",
      email: " ADA@Example.com ",
    });

    expect(repository.publicProfileCalls).toEqual([
      {
        uid: "user-1",
        displayName: "Ada Lovelace",
        email: "ada@example.com",
      },
    ]);
    expect(profile).toMatchObject({
      uid: "user-1",
      displayName: "Ada Lovelace",
      email: "ada@example.com",
    });
  });

  it("keeps a missing display name as null", async () => {
    const { service } = createService();

    const profile = await service.ensurePublicProfile({
      uid: "user-1",
      displayName: null,
      email: "ada@example.com",
    });

    expect(profile.displayName).toBeNull();
  });

  it("rejects an invalid identity without writing", async () => {
    const { repository, service } = createService();
    const failure = service.ensurePublicProfile({
      uid: " ",
      displayName: null,
      email: "not-an-email",
    });

    await expect(failure).rejects.toBeInstanceOf(FriendValidationError);
    await expect(failure).rejects.toMatchObject({
      fieldErrors: { uid: "UID_REQUIRED", email: "EMAIL_INVALID" },
    });
    expect(repository.publicProfileCalls).toEqual([]);
  });

  it("propagates repository failures", async () => {
    const { repository, service } = createService();
    const failure = new Error("write failed");
    repository.failure = failure;

    await expect(
      service.ensurePublicProfile({
        uid: "user-1",
        displayName: "Ada",
        email: "ada@example.com",
      }),
    ).rejects.toBe(failure);
  });
});

describe("FriendsService.getPublicProfile", () => {
  it("returns the public profile of a trimmed uid", async () => {
    const { repository, service } = createService();
    repository.seedProfile("user-1", "Ada", "ada@example.com");

    await expect(service.getPublicProfile(" user-1 ")).resolves.toMatchObject({
      uid: "user-1",
      displayName: "Ada",
    });
  });

  it("returns null for a missing uid without a read", async () => {
    const { repository, service } = createService();

    await expect(service.getPublicProfile("user-2")).resolves.toBeNull();
    await expect(service.getPublicProfile("   ")).resolves.toBeNull();
    expect(repository.publicProfileReads).toEqual(["user-2"]);
  });

  it("propagates repository failures", async () => {
    const { repository, service } = createService();
    const failure = new Error("read failed");
    repository.failure = failure;

    await expect(service.getPublicProfile("user-1")).rejects.toBe(failure);
  });
});
