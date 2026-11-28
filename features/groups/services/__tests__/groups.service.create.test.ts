import { describe, expect, it } from "@jest/globals";

import { GroupValidationError } from "../group.errors";
import { GroupOperationError } from "../group.errors";
import { createGroupsHarness, seedFriend } from "./groups-service.harness";

const input = {
  name: "Viaje",
  description: "Finde",
  defaultCurrency: "EUR" as const,
  inviteeIds: ["user-b"],
};

describe("GroupsService.createGroup", () => {
  it("creates the group for a friend invitee without notifying", async () => {
    const { repository, friends, notifications, service } =
      createGroupsHarness();
    seedFriend(friends, "user-b");

    const group = await service.createGroup(" user-a ", input);

    expect(group.memberIds).toEqual(["user-a"]);
    expect(repository.createInputs[0]).toMatchObject({
      ownerId: "user-a",
      name: "Viaje",
      description: "Finde",
      defaultCurrency: "EUR",
      inviteeIds: ["user-b"],
    });
    // The pending invitations are actionable cards, not notifications.
    expect(notifications.joinOutcomes).toEqual([]);
    expect(notifications.settlements).toEqual([]);
  });

  it("rejects an invitee who is not an accepted friend", async () => {
    const { repository, service } = createGroupsHarness();

    await expect(service.createGroup("user-a", input)).rejects.toMatchObject({
      code: "NOT_FRIEND",
    });
    expect(repository.createInputs).toEqual([]);
  });

  it("validates the form before writing", async () => {
    const { repository, service } = createGroupsHarness();

    await expect(
      service.createGroup("user-a", { ...input, inviteeIds: [] }),
    ).rejects.toBeInstanceOf(GroupValidationError);

    await expect(
      service.createGroup("user-a", { ...input, inviteeIds: ["user-b", "user-b"] }),
    ).rejects.toBeInstanceOf(GroupValidationError);
    expect(repository.createInputs).toEqual([]);
  });

  it("requires a signed-in owner", async () => {
    const { service } = createGroupsHarness();

    await expect(service.createGroup("  ", input)).rejects.toBeInstanceOf(
      GroupOperationError,
    );
  });
});
