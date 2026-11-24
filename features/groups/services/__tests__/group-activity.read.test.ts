import { describe, expect, it, jest } from "@jest/globals";

import { loadGroupActivity } from "../group-activity.read";
import { createGroupsHarness } from "./groups-service.harness";
describe("loadGroupActivity", () => {
  it("rejects a non-member before reading the feed", async () => {
    const { repository } = createGroupsHarness();
    const group = repository.seedGroup({ memberIds: ["user-a", "user-b"] });

    await expect(
      loadGroupActivity(repository, "user-c", group.id),
    ).rejects.toMatchObject({ code: "NOT_GROUP_MEMBER" });
    expect(repository.activityQueries).toEqual([]);
  });

  it("rejects a missing group with GROUP_NOT_FOUND", async () => {
    const { repository } = createGroupsHarness();

    await expect(
      loadGroupActivity(repository, "user-a", "missing"),
    ).rejects.toMatchObject({ code: "GROUP_NOT_FOUND" });
    expect(repository.activityQueries).toEqual([]);
  });

  it("trims the id and clamps the page size to 50", async () => {
    const { repository } = createGroupsHarness();
    const group = repository.seedGroup();

    const page = await loadGroupActivity(repository, "user-a", ` ${group.id} `, {
      limit: 500,
    });

    expect(repository.activityQueries).toEqual([
      { groupId: group.id, query: { limit: 50, after: null } },
    ]);
    expect(page).toEqual({ items: [], hasMore: false, nextCursor: null });
  });

  it("defaults to 20 and forwards the cursor", async () => {
    const { repository } = createGroupsHarness();
    const group = repository.seedGroup();
    const after = { createdAt: "2026-11-20T10:00:00.000Z", id: "activity-9" };

    await loadGroupActivity(repository, "user-a", group.id, { after });

    expect(repository.activityQueries).toEqual([
      { groupId: group.id, query: { limit: 20, after } },
    ]);
  });

  it("passes the operation page through, cursor included", async () => {
    const { repository } = createGroupsHarness();
    const group = repository.seedGroup();
    const nextCursor = {
      createdAt: "2026-11-20T10:00:00.000Z",
      id: "activity-2",
    };
    const page = { items: [], hasMore: true, nextCursor };
    const spy = jest
      .spyOn(repository, "getGroupActivity")
      .mockResolvedValue(page);

    await expect(
      loadGroupActivity(repository, "user-a", group.id),
    ).resolves.toBe(page);
    expect(spy).toHaveBeenCalledWith(group.id, { limit: 20, after: null });
  });
});

describe("GroupsService.getGroupActivity", () => {
  it("delegates through the member guard and the clamped page", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup();

    const page = await service.getGroupActivity("user-a", group.id, {
      limit: 7,
    });

    expect(page).toEqual({ items: [], hasMore: false, nextCursor: null });
    expect(repository.activityQueries).toEqual([
      { groupId: group.id, query: { limit: 7, after: null } },
    ]);
  });

  it("requires a signed-in viewer", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup();

    await expect(service.getGroupActivity("  ", group.id)).rejects.toMatchObject(
      { code: "SIGN_IN_REQUIRED" },
    );
    expect(repository.activityQueries).toEqual([]);
  });
});
