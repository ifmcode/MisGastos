import { describe, expect, it } from "@jest/globals";

import type { ValidatedSharedExpense } from "../../types/shared-expense.types";
import { buildSharedExpense } from "../../utils/__tests__/shared-expense.fixtures";
import {
  createSharedExpenseRecord,
  updateSharedExpenseRecord,
} from "../shared-expense-write";
import {
  FakeSharedExpenseLinkRepository,
  FakeSharedExpensesRepository,
} from "./shared-expenses-service.fakes";

const NOW = "2026-11-16T10:00:00.000Z";

/** Viewer-paid link without a category; the schema blocks it too. */
function buildValue(): ValidatedSharedExpense {
  return {
    participantIds: ["user-a", "user-b"],
    payerId: "user-a",
    amountCents: 1000,
    currency: "EUR",
    splitMode: "equal",
    participants: [
      { userId: "user-a", shareCents: 500 },
      { userId: "user-b", shareCents: 500 },
    ],
    description: "Dinner",
    date: "2026-11-10",
    walletId: "wallet-1",
    categoryId: null,
    linkedTransactionId: null,
  };
}

function createDeps() {
  return {
    repository: new FakeSharedExpensesRepository(),
    linkRepository: new FakeSharedExpenseLinkRepository(),
  };
}

describe("shared expense write category guard", () => {
  it("rejects a viewer-paid create without a category before writing", async () => {
    const deps = createDeps();

    await expect(
      createSharedExpenseRecord(deps, buildValue(), "user-a", NOW),
    ).rejects.toMatchObject({ code: "CATEGORY_REQUIRED" });

    expect(deps.repository.createCalls).toEqual([]);
    expect(deps.linkRepository.createCalls).toEqual([]);
  });

  it("rejects a viewer-paid update without a category before writing", async () => {
    const deps = createDeps();
    const existing = buildSharedExpense({
      walletId: "wallet-1",
      categoryId: "category-1",
      linkedTransactionId: "movement-1",
    });

    await expect(
      updateSharedExpenseRecord(deps, existing, buildValue(), "user-a", NOW),
    ).rejects.toMatchObject({ code: "CATEGORY_REQUIRED" });

    expect(deps.repository.updateCalls).toEqual([]);
    expect(deps.linkRepository.updateCalls).toEqual([]);
  });

  it("rejects a category without a wallet before writing", async () => {
    const deps = createDeps();
    const value: ValidatedSharedExpense = {
      ...buildValue(),
      walletId: null,
      categoryId: "category-1",
    };

    await expect(
      createSharedExpenseRecord(deps, value, "user-a", NOW),
    ).rejects.toMatchObject({ code: "LINK_WITHOUT_REGISTRATION" });

    expect(deps.repository.createCalls).toEqual([]);
    expect(deps.linkRepository.createCalls).toEqual([]);
  });

  it("creates a viewer-paid expense without a link and no movement", async () => {
    const deps = createDeps();
    const value: ValidatedSharedExpense = {
      ...buildValue(),
      walletId: null,
      categoryId: null,
    };

    await createSharedExpenseRecord(deps, value, "user-a", NOW);

    expect(deps.linkRepository.createCalls).toEqual([]);
    expect(deps.repository.createCalls[0]).toMatchObject({
      payerId: "user-a",
      walletId: null,
      categoryId: null,
      linkedTransactionId: null,
    });
  });

  it("reverts the link of an expense whose toggle turns off", async () => {
    const deps = createDeps();
    const existing = buildSharedExpense({
      walletId: "wallet-1",
      categoryId: "category-1",
      linkedTransactionId: "movement-1",
    });
    deps.linkRepository.seed(existing);
    const value: ValidatedSharedExpense = {
      ...buildValue(),
      walletId: null,
      categoryId: null,
    };

    await updateSharedExpenseRecord(deps, existing, value, "user-a", NOW);

    expect(deps.repository.updateCalls).toEqual([]);
    expect(deps.linkRepository.updateCalls[0]?.update).toMatchObject({
      walletId: null,
      categoryId: null,
    });
  });

  it("keeps the social-only friend-paid path without a category", async () => {
    const deps = createDeps();
    const value: ValidatedSharedExpense = {
      ...buildValue(),
      payerId: "user-b",
      walletId: null,
    };

    await createSharedExpenseRecord(deps, value, "user-a", NOW);

    expect(deps.linkRepository.createCalls).toEqual([]);
    expect(deps.repository.createCalls[0]).toMatchObject({
      payerId: "user-b",
      walletId: null,
      categoryId: null,
    });
  });
});
