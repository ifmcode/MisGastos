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

  it("adds the owner join-request queue to the total", () => {
    const overview = {
      incoming: [item("in-1", "incoming")],
      outgoing: [],
    };

    const pending = getPendingRequests(overview, 2);

    expect(pending.incoming.map((request) => request.requestId)).toEqual([
      "in-1",
    ]);
    expect(pending.total).toBe(3);
    expect(countPendingRequests(overview, 2)).toBe(3);
  });

  it("keeps a zero owner join-request count unchanged", () => {
    const overview = { incoming: [item("in-1", "incoming")], outgoing: [] };

    expect(getPendingRequests(overview, 0).total).toBe(1);
    expect(countPendingRequests(overview, 0)).toBe(1);
  });

  it("clamps a negative owner join-request count to zero", () => {
    const overview = { incoming: [item("in-1", "incoming")], outgoing: [] };

    expect(getPendingRequests(overview, -4).total).toBe(1);
    expect(countPendingRequests(overview, -4)).toBe(1);
  });

  it("truncates a non-integer owner join-request count", () => {
    const overview = { incoming: [], outgoing: [] };

    expect(getPendingRequests(overview, 2.7).total).toBe(2);
    expect(countPendingRequests(overview, Number.NaN)).toBe(0);
  });
});
