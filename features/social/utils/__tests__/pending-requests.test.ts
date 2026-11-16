import { describe, expect, it } from "@jest/globals";

import type {
  FriendRequestItem,
  FriendRequestStatus,
} from "@/features/friends/types/friend.types";

import {
  countPendingRequests,
  getPendingRequests,
} from "../pending-requests";

const createdAt = "2026-11-14T10:00:00.000Z";

function item(
  requestId: string,
  direction: FriendRequestItem["direction"],
  status: FriendRequestStatus = "pending",
): FriendRequestItem {
  return {
    requestId,
    profile: {
      uid: `uid-${requestId}`,
      displayName: null,
      email: `${requestId}@example.com`,
    },
    status,
    createdAt,
    updatedAt: createdAt,
    direction,
  };
}

describe("getPendingRequests", () => {
  it("returns zero when there are no requests", () => {
    const pending = getPendingRequests({ incoming: [], outgoing: [] });

    expect(pending).toEqual({ incoming: [], outgoing: [], total: 0 });
    expect(countPendingRequests({ incoming: [], outgoing: [] })).toBe(0);
  });

  it("counts only the incoming direction when that is all there is", () => {
    const pending = getPendingRequests({
      incoming: [item("in-1", "incoming")],
      outgoing: [],
    });

    expect(pending.incoming.map((request) => request.requestId)).toEqual([
      "in-1",
    ]);
    expect(pending.outgoing).toEqual([]);
    expect(pending.total).toBe(1);
  });

  it("adds both directions and keeps their order", () => {
    const overview = {
      incoming: [item("in-1", "incoming"), item("in-2", "incoming")],
      outgoing: [item("out-1", "outgoing")],
    };

    const pending = getPendingRequests(overview);

    expect(pending.incoming.map((request) => request.requestId)).toEqual([
      "in-1",
      "in-2",
    ]);
    expect(pending.outgoing.map((request) => request.requestId)).toEqual([
      "out-1",
    ]);
    expect(pending.total).toBe(3);
    expect(countPendingRequests(overview)).toBe(3);
  });

  it("ignores requests that are no longer pending", () => {
    const overview = {
      incoming: [
        item("in-1", "incoming", "rejected"),
        item("in-2", "incoming"),
      ],
      outgoing: [
        item("out-1", "outgoing", "cancelled"),
        item("out-2", "outgoing", "pending"),
      ],
    };

    const pending = getPendingRequests(overview);

    expect(pending.incoming.map((request) => request.requestId)).toEqual([
      "in-2",
    ]);
    expect(pending.outgoing.map((request) => request.requestId)).toEqual([
      "out-2",
    ]);
    expect(pending.total).toBe(2);
  });
});
