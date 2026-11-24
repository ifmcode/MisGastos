import { describe, expect, it } from "@jest/globals";

import { createGroupsHarness } from "./groups-service.harness";

const NOW_PATTERN = expect.any(String);

describe("GroupsService.leaveGroup", () => {
  it("lets a settled non-owner leave with the name snapshot", async () => {
    const { repository, friends, balances, service } = createGroupsHarness();
    const group = repository.seedGroup({ memberIds: ["user-a", "user-b"] });
    friends.seedProfile("user-b", "Bea", "bea@example.com");

    const updated = await service.leaveGroup("user-b", group.id);

    expect(updated.memberIds).toEqual(["user-a"]);
    expect(repository.leaveInputs).toEqual([
      {
        groupId: group.id,
        memberId: "user-b",
        targetName: "Bea",
        updatedAt: NOW_PATTERN,
      },
    ]);
    expect(balances.calls).toEqual([
      { groupId: group.id, memberId: "user-b" },
    ]);
  });

  it("blocks the owner before reading the ledger", async () => {
    const { repository, balances, service } = createGroupsHarness();
    const group = repository.seedGroup({ memberIds: ["user-a", "user-b"] });

    await expect(
      service.leaveGroup("user-a", group.id),
    ).rejects.toMatchObject({ code: "CANNOT_REMOVE_OWNER" });
    expect(repository.leaveInputs).toEqual([]);
    expect(balances.calls).toEqual([]);
  });

  it("rejects a non-member without reading the ledger", async () => {
    const { repository, balances, service } = createGroupsHarness();
    const group = repository.seedGroup({ memberIds: ["user-a", "user-b"] });

    await expect(
      service.leaveGroup("user-c", group.id),
    ).rejects.toMatchObject({ code: "NOT_GROUP_MEMBER" });
    expect(balances.calls).toEqual([]);
  });

  it("rejects a missing group without reading the ledger", async () => {
    const { balances, service } = createGroupsHarness();

    await expect(
      service.leaveGroup("user-b", "missing"),
    ).rejects.toMatchObject({ code: "GROUP_NOT_FOUND" });
    expect(balances.calls).toEqual([]);
  });

  it("blocks a member whose net is non-zero in any currency", async () => {
    const { repository, balances, service } = createGroupsHarness();
    const group = repository.seedGroup({ memberIds: ["user-a", "user-b"] });
    balances.setNets(group.id, "user-b", [
      { currency: "EUR", netCents: 0 },
      { currency: "USD", netCents: -1250 },
    ]);

    await expect(
      service.leaveGroup("user-b", group.id),
    ).rejects.toMatchObject({ code: "BALANCE_NOT_SETTLED" });
    expect(repository.leaveInputs).toEqual([]);
  });

  it("keeps a null name snapshot when the profile is unknown", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup({ memberIds: ["user-a", "user-b"] });

    await service.leaveGroup("user-b", group.id);

    expect(repository.leaveInputs[0].targetName).toBeNull();
  });
});

describe("GroupsService.removeMember balance guard", () => {
  it("blocks a member whose net is non-zero in any currency", async () => {
    const { repository, balances, service } = createGroupsHarness();
    const group = repository.seedGroup({ memberIds: ["user-a", "user-b"] });
    balances.setNets(group.id, "user-b", [
      { currency: "EUR", netCents: 900 },
    ]);

    await expect(
      service.removeMember("user-a", group.id, "user-b"),
    ).rejects.toMatchObject({ code: "BALANCE_NOT_SETTLED" });
    expect(repository.removedInputs).toEqual([]);
  });

  it("allows a settled member and snapshots the display name", async () => {
    const { repository, friends, balances, service } = createGroupsHarness();
    const group = repository.seedGroup({ memberIds: ["user-a", "user-b"] });
    friends.seedProfile("user-b", "Bea", "bea@example.com");

    const updated = await service.removeMember("user-a", group.id, "user-b");

    expect(updated.memberIds).toEqual(["user-a"]);
    expect(repository.removedInputs[0]).toMatchObject({
      groupId: group.id,
      memberId: "user-b",
      targetName: "Bea",
    });
    expect(balances.calls).toEqual([
      { groupId: group.id, memberId: "user-b" },
    ]);
  });

  it("does not read the ledger for a stranger or a blank id", async () => {
    const { repository, balances, service } = createGroupsHarness();
    const group = repository.seedGroup({ memberIds: ["user-a", "user-b"] });

    await expect(
      service.removeMember("user-a", group.id, "user-z"),
    ).rejects.toMatchObject({ code: "MEMBER_NOT_FOUND" });
    await expect(
      service.removeMember("user-a", group.id, "  "),
    ).rejects.toMatchObject({ code: "MEMBER_NOT_FOUND" });
    await expect(
      service.removeMember("user-a", group.id, undefined as unknown as string),
    ).rejects.toMatchObject({ code: "MEMBER_NOT_FOUND" });
    expect(balances.calls).toEqual([]);
  });
});

describe("GroupsService.transferOwnership", () => {
  it("promotes an active member and reorders the list", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup({ memberIds: ["user-a", "user-b"] });

    const updated = await service.transferOwnership(
      "user-a",
      group.id,
      " user-b ",
    );

    expect(updated).toMatchObject({
      ownerId: "user-b",
      createdBy: "user-a",
      memberIds: ["user-b", "user-a"],
    });
    expect(repository.transfers[0]).toMatchObject({
      groupId: group.id,
      actorId: "user-a",
      newOwnerId: "user-b",
      updatedAt: NOW_PATTERN,
    });
  });

  it("is owner-only", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup({ memberIds: ["user-a", "user-b"] });

    await expect(
      service.transferOwnership("user-b", group.id, "user-b"),
    ).rejects.toMatchObject({ code: "NOT_GROUP_OWNER" });
    expect(repository.transfers).toEqual([]);
  });

  it("rejects a blank, non-member or current-owner target", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup({ memberIds: ["user-a", "user-b"] });

    for (const target of ["  ", "user-z", "user-a"]) {
      await expect(
        service.transferOwnership("user-a", group.id, target),
      ).rejects.toMatchObject({ code: "INVALID_OWNERSHIP_TARGET" });
    }
    await expect(
      service.transferOwnership(
        "user-a",
        group.id,
        undefined as unknown as string,
      ),
    ).rejects.toMatchObject({ code: "INVALID_OWNERSHIP_TARGET" });
    expect(repository.transfers).toEqual([]);
  });

  it("fails for a missing group", async () => {
    const { service } = createGroupsHarness();

    await expect(
      service.transferOwnership("user-a", "missing", "user-b"),
    ).rejects.toMatchObject({ code: "GROUP_NOT_FOUND" });
  });
});
