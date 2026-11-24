import { describe, expect, it } from "@jest/globals";

import { buildGroupActivityData } from "../group-activity.data";

const FULL_INPUT = {
  type: "expense-updated" as const,
  groupId: "user-a__group-1",
  actorId: "user-b",
  createdAt: "2026-11-20T10:00:00.000Z",
  targetUserId: "user-c",
  targetName: "Bea",
  expenseId: "expense-1",
  settlementId: "settlement-1",
  fromUserId: "user-b",
  toUserId: "user-c",
  amountCents: 1200,
  currency: "EUR" as const,
  description: "Dinner",
  changedFields: ["name", "defaultCurrency"] as const,
  simplifyDebts: false,
  previousOwnerId: "user-a",
  newOwnerId: "user-b",
};

describe("buildGroupActivityData", () => {
  it("writes every key, even when the payload is absent", () => {
    const data = buildGroupActivityData({
      type: "member-joined",
      groupId: "user-a__group-1",
      actorId: "user-b",
      createdAt: "2026-11-20T10:00:00.000Z",
    });

    expect(data).toEqual({
      type: "member-joined",
      groupId: "user-a__group-1",
      actorId: "user-b",
      targetUserId: null,
      targetName: null,
      expenseId: null,
      settlementId: null,
      fromUserId: null,
      toUserId: null,
      amountCents: null,
      currency: null,
      description: null,
      changedFields: [],
      simplifyDebts: null,
      previousOwnerId: null,
      newOwnerId: null,
      createdAt: "2026-11-20T10:00:00.000Z",
    });
    expect(Object.values(data)).not.toContain(undefined);
  });

  it("copies the supplied payload and the changed fields", () => {
    const data = buildGroupActivityData(FULL_INPUT);

    expect(data).toMatchObject({
      type: "expense-updated",
      actorId: "user-b",
      targetUserId: "user-c",
      targetName: "Bea",
      expenseId: "expense-1",
      settlementId: "settlement-1",
      fromUserId: "user-b",
      toUserId: "user-c",
      amountCents: 1200,
      currency: "EUR",
      description: "Dinner",
      simplifyDebts: false,
      previousOwnerId: "user-a",
      newOwnerId: "user-b",
    });
    expect(data.changedFields).toEqual(["name", "defaultCurrency"]);
    expect(data.changedFields).not.toBe(FULL_INPUT.changedFields);
  });
});
