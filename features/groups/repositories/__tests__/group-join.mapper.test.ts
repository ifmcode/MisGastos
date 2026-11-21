import { describe, expect, it } from "@jest/globals";

import {
  mapGroupCodeDocument,
  mapGroupJoinRequestDocument,
} from "../groups.mapper";

const GROUP_ID = "user-a__group-1";

describe("mapGroupCodeDocument", () => {
  const codeData: Record<string, unknown> = {
    groupId: GROUP_ID,
    ownerId: "user-a",
    groupName: "Viaje",
  };

  it("maps a projection whose id is the code", () => {
    expect(mapGroupCodeDocument("ABCD2345", codeData)).toEqual({
      code: "ABCD2345",
      groupId: GROUP_ID,
      ownerId: "user-a",
      groupName: "Viaje",
    });
  });

  it("drops a forged code, group, owner or name", () => {
    const invalid: Array<[string, Record<string, unknown>]> = [
      ["ABCD2340", codeData],
      ["abcd2345", codeData],
      ["", codeData],
      ["ABCD2345", { ...codeData, groupId: "" }],
      ["ABCD2345", { ...codeData, ownerId: "" }],
      ["ABCD2345", { ...codeData, groupName: "" }],
      ["ABCD2345", { ...codeData, groupName: "a".repeat(61) }],
    ];

    for (const [id, data] of invalid) {
      expect(mapGroupCodeDocument(id, data)).toBeNull();
    }
  });
});

describe("mapGroupJoinRequestDocument", () => {
  const requestId = `${GROUP_ID}__user-b`;
  const requestData: Record<string, unknown> = {
    groupId: GROUP_ID,
    requesterId: "user-b",
    joinCode: "ABCD2345",
    status: "pending",
    createdAt: "2026-11-20T10:00:00.000Z",
    updatedAt: "2026-11-20T10:00:00.000Z",
  };

  it("maps a valid deterministic request", () => {
    expect(mapGroupJoinRequestDocument(requestId, requestData)).toEqual({
      id: requestId,
      groupId: GROUP_ID,
      requesterId: "user-b",
      joinCode: "ABCD2345",
      status: "pending",
      createdAt: "2026-11-20T10:00:00.000Z",
      updatedAt: "2026-11-20T10:00:00.000Z",
    });
  });

  it("normalizes the stored code and trims the ids", () => {
    const request = mapGroupJoinRequestDocument(` ${requestId} `, {
      ...requestData,
      groupId: ` ${GROUP_ID} `,
      requesterId: " user-b ",
      joinCode: "abcd-2345",
    });

    expect(request).toMatchObject({
      id: requestId,
      requesterId: "user-b",
      joinCode: "ABCD2345",
    });
  });

  it("drops a forged id, status, code or stamp", () => {
    const invalid: Array<[string, Record<string, unknown>]> = [
      [`${GROUP_ID}__user-c`, requestData],
      [requestId, { ...requestData, requesterId: "user-c" }],
      [requestId, { ...requestData, status: "expired" }],
      [requestId, { ...requestData, joinCode: "ABCD2340" }],
      [requestId, { ...requestData, createdAt: "" }],
      [requestId, { ...requestData, updatedAt: 42 }],
      ["group-1__user-b", requestData],
      ["", requestData],
    ];

    for (const [id, data] of invalid) {
      expect(mapGroupJoinRequestDocument(id, data)).toBeNull();
    }
  });
});
