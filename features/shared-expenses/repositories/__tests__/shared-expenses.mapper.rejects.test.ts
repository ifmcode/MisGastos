import { describe, expect, it } from "@jest/globals";

import { mapSharedExpenseDocument } from "../shared-expenses.mapper";
import { buildExpenseDocument } from "./shared-expense-document.fixtures";

describe("mapSharedExpenseDocument rejects malformed documents", () => {
  it("drops a document without a usable id", () => {
    expect(mapSharedExpenseDocument("  ", buildExpenseDocument())).toBeNull();
  });

  it("drops a document without a sorted two-uid pair", () => {
    for (const participantIds of [
      ["user-b", "user-a"],
      ["user-a"],
      undefined,
    ]) {
      expect(
        mapSharedExpenseDocument(
          "expense-1",
          buildExpenseDocument({ participantIds }),
        ),
      ).toBeNull();
    }
  });

  it("drops a document whose stored pairId disagrees with the pair", () => {
    expect(
      mapSharedExpenseDocument(
        "expense-1",
        buildExpenseDocument({ pairId: "user-a__user-c" }),
      ),
    ).toBeNull();
  });

  it("drops a document whose payer is not a participant", () => {
    expect(
      mapSharedExpenseDocument(
        "expense-1",
        buildExpenseDocument({ payerId: "user-c" }),
      ),
    ).toBeNull();
  });

  it("drops a document without a positive integer amount", () => {
    for (const amountCents of [0, -100, 10.5, "1000", undefined]) {
      expect(
        mapSharedExpenseDocument(
          "expense-1",
          buildExpenseDocument({ amountCents }),
        ),
      ).toBeNull();
    }
  });

  it("drops a document with an unknown currency or split mode", () => {
    expect(
      mapSharedExpenseDocument(
        "expense-1",
        buildExpenseDocument({ currency: "BTC" }),
      ),
    ).toBeNull();
    expect(
      mapSharedExpenseDocument(
        "expense-1",
        buildExpenseDocument({ splitMode: "custom" }),
      ),
    ).toBeNull();
  });

  it("drops a document without two usable participant rows", () => {
    const rows = [
      [{ userId: "user-a", shareCents: 1000 }],
      [
        { userId: "user-a", shareCents: 500 },
        { userId: "user-a", shareCents: 500 },
      ],
      [
        { userId: "user-a", shareCents: 500 },
        { userId: "user-c", shareCents: 500 },
      ],
      [
        { userId: "user-a", shareCents: 500 },
        { userId: "user-b", shareCents: -1 },
      ],
      [
        { userId: "user-a", shareCents: 500 },
        { userId: "user-b", shareCents: 500.5 },
      ],
      "nope",
      [null, { userId: "user-b", shareCents: 500 }],
    ];

    for (const participants of rows) {
      expect(
        mapSharedExpenseDocument(
          "expense-1",
          buildExpenseDocument({ participants }),
        ),
      ).toBeNull();
    }
  });
});
