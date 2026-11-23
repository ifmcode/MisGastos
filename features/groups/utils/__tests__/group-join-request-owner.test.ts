import { describe, expect, it } from "@jest/globals";

import type {
  GroupJoinRequest,
  GroupJoinRequestItem,
} from "../../types/group-join.types";
import { buildOwnerJoinRequests, compareOwnerJoinRequests } from "../group-join-request";

function request(overrides: Partial<GroupJoinRequest> = {}): GroupJoinRequest {
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

function item(overrides: Partial<GroupJoinRequest> = {}): GroupJoinRequestItem {
  return { request: request(overrides), requester: null };
}

describe("buildOwnerJoinRequests", () => {
  it("returns an empty queue when no group has requests", () => {
    expect(buildOwnerJoinRequests([], new Map())).toEqual([]);
    expect(
      buildOwnerJoinRequests([{ id: "user-a__g1", name: "Viaje" }], new Map()),
    ).toEqual([]);
  });

  it("flattens every group queue with its group id and name", () => {
    const first = item({ id: "user-a__g1__user-b" });
    const second = item({
      id: "user-a__g1__user-c",
      requesterId: "user-c",
      createdAt: "2026-11-21T10:00:00.000Z",
    });
    const other = item({
      id: "user-a__g2__user-d",
      groupId: "user-a__g2",
      requesterId: "user-d",
    });

    const rows = buildOwnerJoinRequests(
      [
        { id: "user-a__g1", name: "Viaje" },
        { id: "user-a__g2", name: "Piso" },
      ],
      new Map([
        ["user-a__g1", [first, second]],
        ["user-a__g2", [other]],
      ]),
    );

    expect(rows).toEqual([
      { groupId: "user-a__g1", groupName: "Viaje", item: first },
      { groupId: "user-a__g2", groupName: "Piso", item: other },
      { groupId: "user-a__g1", groupName: "Viaje", item: second },
    ]);
  });

  it("skips groups missing from the map and map entries with no group", () => {
    const known = item();

    const rows = buildOwnerJoinRequests(
      [
        { id: "user-a__g1", name: "Viaje" },
        { id: "user-a__g2", name: "Piso" },
      ],
      new Map([["user-a__g1", [known]]]),
    );
    const orphaned = buildOwnerJoinRequests(
      [{ id: "user-a__g1", name: "Viaje" }],
      new Map([
        ["user-a__g1", [known]],
        ["user-a__group-9", [item({ id: "user-a__group-9__user-c" })]],
      ]),
    );

    expect(rows.map((row) => row.groupId)).toEqual(["user-a__g1"]);
    expect(orphaned).toHaveLength(1);
  });

  it("orders oldest first and breaks ties by group id then request id", () => {
    const newer = item({
      id: "user-a__g1__user-b",
      createdAt: "2026-11-21T10:00:00.000Z",
    });
    const tiedG2 = item({
      id: "user-a__g2__user-c",
      groupId: "user-a__g2",
      requesterId: "user-c",
      createdAt: "2026-11-20T10:00:00.000Z",
    });
    const tiedG1B = item({
      id: "user-a__g1__user-d",
      requesterId: "user-d",
      createdAt: "2026-11-20T10:00:00.000Z",
    });
    const tiedG1A = item({
      id: "user-a__g1__user-e",
      requesterId: "user-e",
      createdAt: "2026-11-20T10:00:00.000Z",
    });

    const rows = buildOwnerJoinRequests(
      [
        { id: "user-a__g1", name: "Viaje" },
        { id: "user-a__g2", name: "Piso" },
      ],
      new Map([
        ["user-a__g1", [newer, tiedG1B, tiedG1A]],
        ["user-a__g2", [tiedG2]],
      ]),
    );

    expect(rows.map((row) => row.item.request.id)).toEqual([
      tiedG1B.request.id,
      tiedG1A.request.id,
      tiedG2.request.id,
      newer.request.id,
    ]);
  });

  it("produces the same order regardless of the input order", () => {
    const older = item({ createdAt: "2026-11-19T10:00:00.000Z" });
    const newerG2 = item({
      id: "user-a__g2__user-c",
      groupId: "user-a__g2",
      requesterId: "user-c",
      createdAt: "2026-11-21T10:00:00.000Z",
    });
    const newerG1 = item({
      id: "user-a__g1__user-d",
      requesterId: "user-d",
      createdAt: "2026-11-21T10:00:00.000Z",
    });
    const groups = [
      { id: "user-a__g1", name: "Viaje" },
      { id: "user-a__g2", name: "Piso" },
    ];

    const forward = buildOwnerJoinRequests(groups, new Map([
      ["user-a__g1", [older, newerG1]],
      ["user-a__g2", [newerG2]],
    ]));
    const reversed = buildOwnerJoinRequests([...groups].reverse(), new Map([
      ["user-a__g1", [newerG1, older]],
      ["user-a__g2", [newerG2]],
    ]));

    expect(reversed).toEqual(forward);
    expect(forward.map((row) => row.item.request.id)).toEqual([
      older.request.id,
      newerG1.request.id,
      newerG2.request.id,
    ]);
  });

  it("does not mutate the groups, the map or the queues it receives", () => {
    const older = item({ createdAt: "2026-11-19T10:00:00.000Z" });
    const newer = item({
      id: "user-a__g1__user-c",
      requesterId: "user-c",
      createdAt: "2026-11-21T10:00:00.000Z",
    });
    const groups = [
      { id: "user-a__g1", name: "Viaje" },
      { id: "user-a__g2", name: "Piso" },
    ];
    const queue = [newer, older];
    const itemsByGroup = new Map([["user-a__g1", queue]]);

    buildOwnerJoinRequests(groups, itemsByGroup);

    expect(groups.map((group) => group.id)).toEqual([
      "user-a__g1",
      "user-a__g2",
    ]);
    expect(queue).toEqual([newer, older]);
    expect(itemsByGroup.size).toBe(1);
    expect([...itemsByGroup.keys()]).toEqual(["user-a__g1"]);
  });
});

describe("compareOwnerJoinRequests", () => {
  it("orders two same-second requests of one group by request id", () => {
    const row = {
      groupId: "user-a__g1",
      groupName: "Viaje",
      item: item({ id: "user-a__g1__user-b" }),
    };
    const later = {
      ...row,
      item: item({ id: "user-a__g1__user-c" }),
    };

    expect(compareOwnerJoinRequests(row, row)).toBe(0);
    expect(compareOwnerJoinRequests(row, later)).toBeLessThan(0);
    expect(compareOwnerJoinRequests(later, row)).toBeGreaterThan(0);
  });
});
