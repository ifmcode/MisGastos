import { describe, expect, it } from "@jest/globals";

import type { GroupJoinRequest } from "../../types/group-join.types";
import {
  filterJoinRequestsOfNonMembers,
  filterPendingJoinRequests,
  sortJoinRequestsOldestFirst,
} from "../group-join-request";

function request(
  overrides: Partial<GroupJoinRequest> = {},
): GroupJoinRequest {
  return {
    id: "user-a__g1__user-b",
    groupId: "user-a__g1",
    requesterId: "user-b",
    joinCode: "ABCD2345",
    status: "pending",
    createdAt: "2026-11-20T10:00:00.000Z",
    updatedAt: "2026-11-20T10:00:00.000Z",
    ...overrides,
  };
}

describe("filterPendingJoinRequests", () => {
  it("keeps only pending requests", () => {
    const pending = request();
    const accepted = request({ status: "accepted" });
    const rejected = request({ status: "rejected" });

    expect(
      filterPendingJoinRequests([pending, accepted, rejected]),
    ).toEqual([pending]);
  });
});

describe("filterJoinRequestsOfNonMembers", () => {
  it("drops a pending row from someone who already joined by invitation", () => {
    const memberRequest = request({ requesterId: "user-b" });
    const outsiderRequest = request({ requesterId: "user-c" });

    expect(
      filterJoinRequestsOfNonMembers(
        [memberRequest, outsiderRequest],
        ["user-a", "user-b"],
      ),
    ).toEqual([outsiderRequest]);
  });
});

describe("sortJoinRequestsOldestFirst", () => {
  it("orders by createdAt and breaks ties by id", () => {
    const newer = request({
      id: "user-a__g1__user-c",
      requesterId: "user-c",
      createdAt: "2026-11-21T10:00:00.000Z",
    });
    const olderB = request({
      id: "user-a__g1__user-b",
      createdAt: "2026-11-19T10:00:00.000Z",
    });
    const olderC = request({
      id: "user-a__g1__user-c",
      requesterId: "user-c",
      createdAt: "2026-11-19T10:00:00.000Z",
    });

    expect(
      sortJoinRequestsOldestFirst([newer, olderC, olderB]).map(
        (item) => item.id,
      ),
    ).toEqual([olderB.id, olderC.id, newer.id]);
  });

  it("does not mutate the input and is stable for equal ids", () => {
    const first = request();
    const source = [first, first];

    expect(sortJoinRequestsOldestFirst(source)).toEqual(source);
    expect(source).toHaveLength(2);
  });
});
