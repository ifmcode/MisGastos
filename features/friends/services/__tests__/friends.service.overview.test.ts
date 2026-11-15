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

  return { repository, ledger, service: new FriendsService(repository, ledger) };
}

function seedLedger(
  ledger: FakeFriendLedgerRepository,
  fromUserId: string,
  toUserId: string,
  amountCents: number,
  deletedAt: string | null = null,
): void {
  ledger.entries.push({
    id: `${fromUserId}-${toUserId}-${amountCents}`,
    fromUserId,
    toUserId,
    amountCents,
    deletedAt,
  });
}

describe("FriendsService.getOverview", () => {
  it("returns empty sections without loading profiles", async () => {
    const { repository, service } = createService();

    await expect(service.getOverview("user-a")).resolves.toEqual({
      friends: [],
      incoming: [],
      outgoing: [],
    });
    expect(repository.profileBatchCalls).toEqual([]);
  });

  it("folds the ledger into the net balance of each friend", async () => {
    const { repository, ledger, service } = createService();
    repository.seedProfile("user-b", "Bea", "bea@example.com");
    repository.seedProfile("user-c", "Cid", "cid@example.com");
    repository.seedFriendship("user-a", "user-b", "2026-11-01T10:00:00.000Z");
    repository.seedFriendship("user-a", "user-c", "2026-11-02T10:00:00.000Z");
    seedLedger(ledger, "user-b", "user-a", 1500);
    seedLedger(ledger, "user-b", "user-a", 500, "2026-11-10T10:00:00.000Z");
    seedLedger(ledger, "user-a", "user-c", 2400);
    seedLedger(ledger, "user-c", "someone-else", 9999);

    const overview = await service.getOverview(" user-a ");

    expect(overview.friends).toEqual([
      {
        uid: "user-b",
        displayName: "Bea",
        email: "bea@example.com",
        netBalanceCents: 1500,
        since: "2026-11-01T10:00:00.000Z",
      },
      {
        uid: "user-c",
        displayName: "Cid",
        email: "cid@example.com",
        netBalanceCents: -2400,
        since: "2026-11-02T10:00:00.000Z",
      },
    ]);
    expect(repository.profileBatchCalls).toEqual([["user-b", "user-c"]]);
  });

  it("falls back to the uid when the profile is missing", async () => {
    const { repository, service } = createService();
    repository.seedFriendship("user-a", "user-b");
    repository.seedProfile("user-c", "Cid", "cid@example.com");
    repository.seedFriendship("user-a", "user-c");

    const overview = await service.getOverview("user-a");

    expect(overview.friends.map((friend) => friend.uid)).toEqual([
      "user-c",
      "user-b",
    ]);
    expect(overview.friends[1]).toMatchObject({
      uid: "user-b",
      displayName: null,
      email: "",
      netBalanceCents: 0,
    });
  });

  it("sorts friends by email when the display name is missing", async () => {
    const { repository, service } = createService();
    repository.seedProfile("user-b", null, "zoe@example.com");
    repository.seedProfile("user-c", null, "ana@example.com");
    repository.seedFriendship("user-a", "user-b");
    repository.seedFriendship("user-a", "user-c");

    const overview = await service.getOverview("user-a");

    expect(overview.friends.map((friend) => friend.email)).toEqual([
      "ana@example.com",
      "zoe@example.com",
    ]);
  });

  it("splits pending requests and sorts each section newest first", async () => {
    const { repository, service } = createService();
    repository.seedProfile("user-b", "Bea", "bea@example.com");
    repository.seedProfile("user-c", "Cid", "cid@example.com");
    repository.seedRequest(
      "user-a",
      "user-b",
      "pending",
      "2026-11-01T10:00:00.000Z",
    );
    repository.seedRequest(
      "user-a",
      "user-c",
      "pending",
      "2026-11-05T10:00:00.000Z",
    );
    repository.seedProfile("user-d", "Dee", "dee@example.com");
    repository.seedRequest(
      "user-d",
      "user-a",
      "pending",
      "2026-11-03T10:00:00.000Z",
    );
    repository.seedProfile("user-e", "Eve", "eve@example.com");
    repository.seedRequest("user-e", "user-a", "rejected");

    const overview = await service.getOverview("user-a");

    expect(overview.outgoing.map((item) => item.profile.uid)).toEqual([
      "user-c",
      "user-b",
    ]);
    expect(overview.outgoing[0]).toMatchObject({
      direction: "outgoing",
      status: "pending",
      requestId: "user-a__user-c",
    });
    expect(overview.incoming).toHaveLength(1);
    expect(overview.incoming[0]).toMatchObject({
      direction: "incoming",
      requestId: "user-a__user-d",
      profile: { uid: "user-d", displayName: "Dee" },
    });
    expect(repository.profileBatchCalls).toEqual([
      ["user-b", "user-c", "user-d"],
    ]);
  });

  it("validates the viewer", async () => {
    const { service } = createService();

    await expect(service.getOverview("  ")).rejects.toBeInstanceOf(
      FriendValidationError,
    );
  });
});
