import { describe, expect, it } from "@jest/globals";

import { GroupValidationError } from "../group.errors";
import { createGroupsHarness } from "./groups-service.harness";

const update = {
  name: "Viaje Nuevo",
  description: "Finde",
  defaultCurrency: "USD" as const,
  simplifyDebts: false,
};

describe("GroupsService.updateGroup", () => {
  it("lets the owner edit the metadata", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup();

    const updated = await service.updateGroup("user-a", group.id, update);

    expect(updated).toMatchObject({
      name: "Viaje Nuevo",
      defaultCurrency: "USD",
      simplifyDebts: false,
    });
    expect(repository.updateInputs[0]).toMatchObject({
      groupId: group.id,
      update: { ...update, updatedAt: expect.any(String) },
    });
  });

  it("rejects a non-owner edit", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup({ memberIds: ["user-a", "user-b"] });

    await expect(
      service.updateGroup("user-b", group.id, update),
    ).rejects.toMatchObject({ code: "NOT_GROUP_OWNER" });
    expect(repository.updateInputs).toEqual([]);
  });

  it("validates the payload and the group before writing", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup();

    await expect(
      service.updateGroup("user-a", group.id, { ...update, name: " ", defaultCurrency: "EUR" }),
    ).rejects.toBeInstanceOf(GroupValidationError);

    await expect(
      service.updateGroup("user-a", "missing", update),
    ).rejects.toMatchObject({ code: "GROUP_NOT_FOUND" });
    expect(repository.updateInputs).toEqual([]);
  });
});

describe("GroupsService.removeMember", () => {
  it("lets the owner remove another member", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup({ memberIds: ["user-a", "user-b"] });

    const updated = await service.removeMember("user-a", group.id, " user-b ");

    expect(updated.memberIds).toEqual(["user-a"]);
    expect(repository.removedMembers).toEqual([
      { groupId: group.id, memberId: "user-b" },
    ]);
  });

  it("rejects a non-owner and a blank member id", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup({ memberIds: ["user-a", "user-b"] });

    await expect(
      service.removeMember("user-b", group.id, "user-a"),
    ).rejects.toMatchObject({ code: "NOT_GROUP_OWNER" });

    await expect(
      service.removeMember("user-a", group.id, "  "),
    ).rejects.toMatchObject({ code: "MEMBER_NOT_FOUND" });
    expect(repository.removedMembers).toEqual([]);
  });

  it("fails for a missing group", async () => {
    const { service } = createGroupsHarness();

    await expect(
      service.removeMember("user-a", "missing", "user-b"),
    ).rejects.toMatchObject({ code: "GROUP_NOT_FOUND" });
  });
});
