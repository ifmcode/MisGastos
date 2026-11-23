import { describe, expect, it } from "@jest/globals";

import type { ValidatedGroupExpense } from "../../types/group-expense.types";
import {
  createGroupExpenseRecord,
  deleteGroupExpenseRecord,
  updateGroupExpenseRecord,
} from "../group-expense-write";
import {
  FakeGroupExpensesRepository,
  FakeGroupExpenseLinkRepository,
  NOW,
  buildExpense,
} from "./group-expenses-service.fakes";

/** Social-only viewer-paid value; override only the link under test. */
const SOCIAL: ValidatedGroupExpense = {
  groupId: "user-a__group-1",
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
  walletId: null,
  categoryId: null,
  linkedTransactionId: null,
};

const LINKED: ValidatedGroupExpense = {
  ...SOCIAL,
  walletId: "wallet-1",
  categoryId: "category-1",
};

const LINKED_EXPENSE = buildExpense({
  walletId: "wallet-1",
  categoryId: "category-1",
  linkedTransactionId: "movement-1",
});

function createDeps() {
  return {
    repository: new FakeGroupExpensesRepository(),
    linkRepository: new FakeGroupExpenseLinkRepository(),
  };
}

describe("createGroupExpenseRecord", () => {
  it("creates a social expense through the plain repository", async () => {
    const deps = createDeps();

    await createGroupExpenseRecord(deps, SOCIAL, "user-a", NOW);

    expect(deps.linkRepository.createCalls).toEqual([]);
    expect(deps.repository.createCalls[0]).toMatchObject({
      payerId: "user-a",
      walletId: null,
      categoryId: null,
      linkedTransactionId: null,
    });
  });

  it("creates a linked expense through the atomic pair", async () => {
    const deps = createDeps();

    await createGroupExpenseRecord(deps, LINKED, "user-a", NOW);

    expect(deps.repository.createCalls).toEqual([]);
    expect(deps.linkRepository.createCalls[0]).toMatchObject({
      payerId: "user-a",
      walletId: "wallet-1",
      categoryId: "category-1",
      linkedTransactionId: null,
    });
  });

  it("drops the wallet when another member pays", async () => {
    const deps = createDeps();

    await createGroupExpenseRecord(
      deps,
      { ...LINKED, payerId: "user-b" },
      "user-a",
      NOW,
    );

    expect(deps.linkRepository.createCalls).toEqual([]);
    expect(deps.repository.createCalls[0]).toMatchObject({
      payerId: "user-b",
      walletId: null,
      categoryId: null,
    });
  });

  it("rejects a viewer link without a category before writing", async () => {
    const deps = createDeps();

    await expect(
      createGroupExpenseRecord(
        deps,
        { ...LINKED, categoryId: null },
        "user-a",
        NOW,
      ),
    ).rejects.toMatchObject({ code: "CATEGORY_REQUIRED" });

    expect(deps.repository.createCalls).toEqual([]);
    expect(deps.linkRepository.createCalls).toEqual([]);
  });

  it("rejects leftover ids when the toggle is off", async () => {
    const deps = createDeps();

    await expect(
      createGroupExpenseRecord(
        deps,
        { ...SOCIAL, categoryId: "category-1" },
        "user-a",
        NOW,
      ),
    ).rejects.toMatchObject({ code: "LINK_WITHOUT_REGISTRATION" });

    expect(deps.repository.createCalls).toEqual([]);
  });
});

describe("updateGroupExpenseRecord", () => {
  it("updates a social-only expense through the plain repository", async () => {
    const deps = createDeps();
    deps.repository.seed(buildExpense());

    await updateGroupExpenseRecord(
      deps,
      buildExpense(),
      SOCIAL,
      "user-a",
      NOW,
    );

    expect(deps.linkRepository.updateCalls).toEqual([]);
    expect(deps.repository.updateCalls[0]?.update).toMatchObject({
      walletId: null,
      categoryId: null,
    });
  });

  it("links a social expense when the viewer pays through a wallet", async () => {
    const deps = createDeps();
    deps.linkRepository.seed(buildExpense());

    await updateGroupExpenseRecord(
      deps,
      buildExpense(),
      LINKED,
      "user-a",
      NOW,
    );

    expect(deps.repository.updateCalls).toEqual([]);
    expect(deps.linkRepository.updateCalls[0]).toMatchObject({
      viewerUid: "user-a",
      expenseId: "expense-1",
      update: { walletId: "wallet-1", categoryId: "category-1" },
    });
  });

  it("keeps the link path when the toggle turns off (revert and soft delete)", async () => {
    const deps = createDeps();
    deps.linkRepository.seed(LINKED_EXPENSE);

    await updateGroupExpenseRecord(
      deps,
      LINKED_EXPENSE,
      SOCIAL,
      "user-a",
      NOW,
    );

    expect(deps.repository.updateCalls).toEqual([]);
    expect(deps.linkRepository.updateCalls[0]).toMatchObject({
      viewerUid: "user-a",
      update: { walletId: null, categoryId: null },
    });
  });

  it("keeps the link path on a currency change without a wallet", async () => {
    const deps = createDeps();
    deps.linkRepository.seed(LINKED_EXPENSE);

    await updateGroupExpenseRecord(
      deps,
      LINKED_EXPENSE,
      { ...SOCIAL, currency: "USD" },
      "user-a",
      NOW,
    );

    expect(deps.repository.updateCalls).toEqual([]);
    expect(deps.linkRepository.updateCalls[0]?.update).toMatchObject({
      currency: "USD",
      walletId: null,
      categoryId: null,
    });
  });

  it("rejects an editor who is not the payer of a linked expense", async () => {
    const deps = createDeps();
    const foreign = buildExpense({ ...LINKED_EXPENSE, payerId: "user-b" });

    await expect(
      updateGroupExpenseRecord(deps, foreign, SOCIAL, "user-a", NOW),
    ).rejects.toMatchObject({ code: "LINKED_MOVEMENT_FOREIGN" });

    expect(deps.repository.updateCalls).toEqual([]);
    expect(deps.linkRepository.updateCalls).toEqual([]);
  });
});

describe("deleteGroupExpenseRecord", () => {
  it("soft-deletes a social expense through the plain repository", async () => {
    const deps = createDeps();

    await deleteGroupExpenseRecord(deps, buildExpense(), "user-a", NOW);

    expect(deps.linkRepository.deleteCalls).toEqual([]);
    expect(deps.repository.deleteCalls).toEqual([
      { expenseId: "expense-1", deletedAt: NOW },
    ]);
  });

  it("reverts a linked expense through the atomic pair for the payer", async () => {
    const deps = createDeps();

    await deleteGroupExpenseRecord(deps, LINKED_EXPENSE, "user-a", NOW);

    expect(deps.repository.deleteCalls).toEqual([]);
    expect(deps.linkRepository.deleteCalls).toEqual([
      { viewerUid: "user-a", expenseId: "expense-1", deletedAt: NOW },
    ]);
  });

  it("rejects deleting a linked expense paid by another member", async () => {
    const deps = createDeps();
    const foreign = buildExpense({ ...LINKED_EXPENSE, payerId: "user-b" });

    await expect(
      deleteGroupExpenseRecord(deps, foreign, "user-a", NOW),
    ).rejects.toMatchObject({ code: "LINKED_MOVEMENT_FOREIGN" });

    expect(deps.repository.deleteCalls).toEqual([]);
    expect(deps.linkRepository.deleteCalls).toEqual([]);
  });
});
