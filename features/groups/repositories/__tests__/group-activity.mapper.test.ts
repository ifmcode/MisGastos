import { describe, expect, it } from "@jest/globals";

import { mapGroupActivityDocument } from "../group-activity.mapper";

const STORED = {
  type: "settlement-created",
  groupId: "user-a__group-1",
  actorId: "user-b",
  targetUserId: null,
  targetName: null,
  expenseId: null,
  settlementId: "settlement-1",
  fromUserId: "user-b",
  toUserId: "user-c",
  amountCents: 1000,
  currency: "EUR",
  description: "Dinner",
  changedFields: [],
  simplifyDebts: null,
  previousOwnerId: null,
  newOwnerId: null,
  createdAt: "2026-11-20T10:00:00.000Z",
};

const ID = "activity-1";

describe("mapGroupActivityDocument", () => {
  it("maps a complete record", () => {
    expect(mapGroupActivityDocument(ID, STORED)).toEqual({
      ...STORED,
      id: ID,
      currency: "EUR",
      targetUserId: null,
      targetName: null,
      expenseId: null,
      settlementId: "settlement-1",
      fromUserId: "user-b",
      toUserId: "user-c",
      amountCents: 1000,
      description: "Dinner",
      changedFields: [],
      simplifyDebts: null,
      previousOwnerId: null,
      newOwnerId: null,
    });
  });

  it("drops an unknown type or a blank identity", () => {
    expect(
      mapGroupActivityDocument(ID, { ...STORED, type: "unknown" }),
    ).toBeNull();
    expect(mapGroupActivityDocument("", STORED)).toBeNull();
    expect(mapGroupActivityDocument(ID, { ...STORED, groupId: " " })).toBeNull();
    expect(mapGroupActivityDocument(ID, { ...STORED, actorId: "" })).toBeNull();
  });

  it("drops a missing or blank createdAt", () => {
    expect(
      mapGroupActivityDocument(ID, { ...STORED, createdAt: undefined }),
    ).toBeNull();
    expect(mapGroupActivityDocument(ID, { ...STORED, createdAt: "  " })).toBeNull();
  });

  it("drops an out-of-range amount, currency or text", () => {
    expect(
      mapGroupActivityDocument(ID, { ...STORED, amountCents: 0 }),
    ).toBeNull();
    expect(
      mapGroupActivityDocument(ID, { ...STORED, amountCents: 100_000_001 }),
    ).toBeNull();
    expect(
      mapGroupActivityDocument(ID, { ...STORED, currency: "BTC" }),
    ).toBeNull();
    expect(
      mapGroupActivityDocument(ID, { ...STORED, description: "x".repeat(501) }),
    ).toBeNull();
    expect(
      mapGroupActivityDocument(ID, { ...STORED, targetName: "x".repeat(61) }),
    ).toBeNull();
  });

  it("drops malformed changedFields and simplifyDebts", () => {
    expect(
      mapGroupActivityDocument(ID, { ...STORED, changedFields: "name" }),
    ).toBeNull();
    expect(
      mapGroupActivityDocument(ID, { ...STORED, changedFields: ["amountCents"] }),
    ).toBeNull();
    expect(
      mapGroupActivityDocument(ID, { ...STORED, simplifyDebts: "yes" }),
    ).toBeNull();
  });

  it("keeps the settlement pair and nulls it on other types", () => {
    expect(mapGroupActivityDocument(ID, STORED)).toMatchObject({
      fromUserId: "user-b",
      toUserId: "user-c",
    });

    const groupEvent = {
      type: "group-updated",
      groupId: "user-a__group-1",
      actorId: "user-a",
      createdAt: "2026-11-20T10:00:00.000Z",
      changedFields: ["name"],
    };

    expect(mapGroupActivityDocument(ID, groupEvent)).toMatchObject({
      fromUserId: null,
      toUserId: null,
    });
  });

  it("drops a malformed settlement pair", () => {
    expect(
      mapGroupActivityDocument(ID, { ...STORED, fromUserId: 42 }),
    ).toBeNull();
    expect(
      mapGroupActivityDocument(ID, { ...STORED, toUserId: "x".repeat(1501) }),
    ).toBeNull();
    expect(
      mapGroupActivityDocument(ID, { ...STORED, toUserId: {} }),
    ).toBeNull();
  });

  it("keeps a legacy document without the optional keys", () => {
    const legacy = {
      type: "member-joined",
      groupId: "user-a__group-1",
      actorId: "user-b",
      createdAt: "2026-11-20T10:00:00.000Z",
    };

    expect(mapGroupActivityDocument(ID, legacy)).toMatchObject({
      id: ID,
      type: "member-joined",
      changedFields: [],
      amountCents: null,
      currency: null,
    });
  });
});
