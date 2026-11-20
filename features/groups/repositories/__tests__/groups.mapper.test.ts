import { describe, expect, it } from "@jest/globals";

import {
  mapGroupDocument,
  mapGroupInvitationDocument,
} from "../groups.mapper";

const GROUP_ID = "user-a__group-1";
const INVITATION_ID = `${GROUP_ID}__user-b`;

const groupData: Record<string, unknown> = {
  ownerId: "user-a",
  memberIds: ["user-a", "user-b"],
  name: "Viaje",
  description: "Finde",
  defaultCurrency: "EUR",
  createdAt: "2026-11-20T10:00:00.000Z",
  updatedAt: "2026-11-20T10:00:00.000Z",
};

const invitationData: Record<string, unknown> = {
  groupId: GROUP_ID,
  groupName: "Viaje",
  inviterId: "user-a",
  inviteeId: "user-b",
  pairId: "user-a__user-b",
  status: "pending",
  createdAt: "2026-11-20T10:00:00.000Z",
  updatedAt: "2026-11-20T10:00:00.000Z",
};

describe("mapGroupDocument", () => {
  it("maps a valid group and trims its values", () => {
    expect(
      mapGroupDocument(` ${GROUP_ID} `, {
        ...groupData,
        ownerId: " user-a ",
        memberIds: ["user-a ", "user-b"],
        name: " Viaje ",
        description: " Finde ",
      }),
    ).toEqual({
      id: GROUP_ID,
      ownerId: "user-a",
      memberIds: ["user-a", "user-b"],
      name: "Viaje",
      description: "Finde",
      defaultCurrency: "EUR",
      createdAt: "2026-11-20T10:00:00.000Z",
      updatedAt: "2026-11-20T10:00:00.000Z",
    });
  });

  it("keeps an empty description as null", () => {
    const group = mapGroupDocument(GROUP_ID, {
      ...groupData,
      description: "   ",
    });

    expect(group?.description).toBeNull();
  });

  it("drops a group whose id is not owner-namespaced", () => {
    expect(mapGroupDocument("group-1", groupData)).toBeNull();
    expect(mapGroupDocument("user-b__group-1", groupData)).toBeNull();
    expect(mapGroupDocument("user-a_group-1", groupData)).toBeNull();
    expect(mapGroupDocument("user-a__", groupData)).toBeNull();
  });

  it("drops a document the rules would not accept", () => {
    const invalid: Array<Record<string, unknown>> = [
      { ...groupData, ownerId: "" },
      { ...groupData, memberIds: ["user-b", "user-a"] },
      { ...groupData, memberIds: ["user-a", "user-b", "user-b"] },
      { ...groupData, memberIds: [] },
      { ...groupData, memberIds: ["user-a", 42] },
      {
        ...groupData,
        memberIds: Array.from({ length: 21 }, (_, index) => `user-${index}`),
      },
      { ...groupData, defaultCurrency: "BTC" },
      { ...groupData, name: "" },
      { ...groupData, name: "a".repeat(61) },
      { ...groupData, description: "a".repeat(201) },
      { ...groupData, description: 42 },
      { ...groupData, createdAt: "" },
      { ...groupData, updatedAt: undefined },
    ];

    for (const data of invalid) {
      expect(mapGroupDocument(GROUP_ID, data)).toBeNull();
    }
    expect(mapGroupDocument("", groupData)).toBeNull();
  });
});

describe("mapGroupInvitationDocument", () => {
  it("maps a valid invitation", () => {
    const invitation = mapGroupInvitationDocument(
      INVITATION_ID,
      invitationData,
    );

    expect(invitation).toEqual({
      id: INVITATION_ID,
      groupId: GROUP_ID,
      groupName: "Viaje",
      inviterId: "user-a",
      inviteeId: "user-b",
      pairId: "user-a__user-b",
      status: "pending",
      createdAt: "2026-11-20T10:00:00.000Z",
      updatedAt: "2026-11-20T10:00:00.000Z",
    });
  });

  it("drops a forged group, id, pair or status", () => {
    const forgedGroup = "user-b__group-1";
    const invalid: Array<[string, Record<string, unknown>]> = [
      [INVITATION_ID, { ...invitationData, groupId: forgedGroup }],
      [`${forgedGroup}__user-b`, { ...invitationData, groupId: forgedGroup }],
      [`${GROUP_ID}__user-x`, invitationData],
      [INVITATION_ID, { ...invitationData, pairId: "user-a__user-c" }],
      [INVITATION_ID, { ...invitationData, pairId: "user-b__user-a" }],
      [INVITATION_ID, { ...invitationData, status: "expired" }],
      [INVITATION_ID, { ...invitationData, groupName: "" }],
      [INVITATION_ID, { ...invitationData, groupName: "a".repeat(61) }],
      [INVITATION_ID, { ...invitationData, updatedAt: "" }],
      ["", invitationData],
    ];

    for (const [id, data] of invalid) {
      expect(mapGroupInvitationDocument(id, data)).toBeNull();
    }
  });
});
