import { describe, expect, it } from "@jest/globals";

import type { GroupInvitation } from "../../types/group.types";
import { notifyGroupInvitations } from "../group-notify";
import { FakeGroupNotificationPort } from "./groups-service.fakes";

function invitation(inviteeId: string): GroupInvitation {
  return {
    id: `group-1__${inviteeId}`,
    groupId: "group-1",
    groupName: "Viaje",
    inviterId: "user-a",
    inviteeId,
    pairId: `user-a__${inviteeId}`,
    status: "pending",
    createdAt: "2026-11-20T10:00:00.000Z",
    updatedAt: "2026-11-20T10:00:00.000Z",
  };
}

describe("notifyGroupInvitations", () => {
  it("sends one notification per invitation", async () => {
    const port = new FakeGroupNotificationPort();

    await notifyGroupInvitations(port, [invitation("user-b"), invitation("user-c")]);

    expect(port.sent.map((item) => item.inviteeId)).toEqual(["user-b", "user-c"]);
  });

  it("reads nothing and sends nothing for an empty batch", async () => {
    const port = new FakeGroupNotificationPort();

    await notifyGroupInvitations(port, []);

    expect(port.sent).toEqual([]);
  });

  it("never fails the caller when a notification write fails", async () => {
    const port = new FakeGroupNotificationPort();
    port.failure = new Error("notifications unavailable");

    await expect(
      notifyGroupInvitations(port, [invitation("user-b")]),
    ).resolves.toBeUndefined();
  });
});
