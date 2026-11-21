import { describe, expect, it } from "@jest/globals";

import { mapGroupExpenseDocument } from "../group-expenses.mapper";
import { buildDocument } from "./group-expense-document.fixtures";

function rejects(overrides: Record<string, unknown>): boolean {
  return mapGroupExpenseDocument("expense-1", buildDocument(overrides)) === null;
}

describe("mapGroupExpenseDocument rejects malformed documents", () => {
  it("requires an id, a group, a payer and the creation stamps", () => {
    expect(mapGroupExpenseDocument("  ", buildDocument())).toBeNull();
    expect(rejects({ groupId: " " })).toBe(true);
    expect(rejects({ groupId: 7 })).toBe(true);
    expect(rejects({ payerId: "" })).toBe(true);
    expect(rejects({ createdBy: "" })).toBe(true);
    expect(rejects({ createdAt: undefined })).toBe(true);
  });

  it("requires a positive bounded integer amount", () => {
    expect(rejects({ amountCents: 0 })).toBe(true);
    expect(rejects({ amountCents: -100 })).toBe(true);
    expect(rejects({ amountCents: 10.5 })).toBe(true);
    expect(rejects({ amountCents: "1000" })).toBe(true);
    expect(rejects({ amountCents: 100_000_001 })).toBe(true);
  });

  it("requires a supported currency and split mode", () => {
    expect(rejects({ currency: "BTC" })).toBe(true);
    expect(rejects({ splitMode: "EQUAL" })).toBe(true);
  });

  it("requires a bounded description with a parseable date", () => {
    expect(rejects({ description: "   " })).toBe(true);
    expect(rejects({ description: "x".repeat(121) })).toBe(true);
    expect(rejects({ date: "2026-02-31" })).toBe(true);
    expect(rejects({ date: undefined })).toBe(true);
  });

  it("requires a participant list between 1 and 20 rows", () => {
    expect(rejects({ participants: undefined })).toBe(true);
    expect(rejects({ participants: [] })).toBe(true);
    expect(
      rejects({
        participants: Array.from({ length: 21 }, () => ({
          userId: "user-a",
          shareCents: 0,
        })),
      }),
    ).toBe(true);
  });

  it("rejects unusable or duplicated participant rows", () => {
    expect(rejects({ participants: [null] })).toBe(true);
    expect(rejects({ participants: [{ shareCents: 100 }] })).toBe(true);
    expect(rejects({ participants: [{ userId: "user-a", shareCents: -1 }] })).toBe(
      true,
    );
    expect(
      rejects({ participants: [{ userId: "user-a", shareCents: 1.5 }] }),
    ).toBe(true);
    expect(
      rejects({ participants: [{ userId: "user-a", shareCents: 100_000_001 }] }),
    ).toBe(true);
    expect(
      rejects({
        participants: [
          { userId: "user-a", shareCents: 100 },
          { userId: "user-a", shareCents: 100 },
        ],
      }),
    ).toBe(true);
  });
});
