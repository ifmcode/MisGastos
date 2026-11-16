import { describe, expect, it, jest } from "@jest/globals";

jest.mock("firebase/firestore", () => ({}));
jest.mock("@/lib/firebase", () => ({ db: {} }));

import { FakeSharedExpensesRepository } from "../../services/__tests__/shared-expenses-service.fakes";
import { buildSharedExpense } from "../../utils/__tests__/shared-expense.fixtures";
import { SharedExpenseLedgerRepository } from "../shared-expense-ledger.repository";

describe("SharedExpenseLedgerRepository", () => {
  it("derives one ledger row per non-payer share of the active expenses", async () => {
    const repository = new FakeSharedExpensesRepository();
    repository.seed(
      buildSharedExpense({
        id: "expense-1",
        amountCents: 1000,
        participants: [
          { userId: "user-a", shareCents: 300 },
          { userId: "user-b", shareCents: 700 },
        ],
      }),
    );
    repository.seed(
      buildSharedExpense({
        id: "expense-deleted",
        payerId: "user-b",
        participants: [
          { userId: "user-a", shareCents: 400 },
          { userId: "user-b", shareCents: 600 },
        ],
        deletedAt: "2026-11-14T10:00:00.000Z",
      }),
    );
    repository.seed(
      buildSharedExpense({
        id: "expense-foreign",
        participantIds: ["user-b", "user-c"],
        pairId: "user-b__user-c",
      }),
    );

    const entries = await new SharedExpenseLedgerRepository(
      repository,
    ).getEntries("user-a");

    expect(entries).toEqual([
      {
        id: "expense-1",
        fromUserId: "user-b",
        toUserId: "user-a",
        amountCents: 700,
        currency: "EUR",
        deletedAt: null,
      },
    ]);
  });
});
