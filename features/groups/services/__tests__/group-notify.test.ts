import { describe, expect, it } from "@jest/globals";

import { notifyGroupJoinOutcome } from "../group-notify";
import { FakeGroupNotificationPort } from "./groups-service.fakes";

describe("notifyGroupJoinOutcome", () => {
  it("sends one outcome notification and swallows a failure", async () => {
    const port = new FakeGroupNotificationPort();
    const input = {
      requestId: "group-1__user-b",
      groupId: "group-1",
      groupName: "Viaje",
      requesterId: "user-b",
      ownerId: "user-a",
      decision: "rejected" as const,
      notifiedAt: "2026-11-20T10:00:00.000Z",
    };

    await notifyGroupJoinOutcome(port, input);
    expect(port.joinOutcomes).toEqual([input]);

    port.failure = new Error("notifications unavailable");
    await expect(notifyGroupJoinOutcome(port, input)).resolves.toBeUndefined();
  });
});
