import { describe, expect, it } from "@jest/globals";

import type { Wallet } from "@/features/wallets/types/wallet.types";

import type { GroupExpense } from "../../types/group-expense.types";
import { getGroupExpenseInitialValues } from "../group-expense-form-load";
import {
  buildExpense,
  buildMembers,
  buildWallet,
  GROUP_ID,
  TODAY,
  VIEWER,
} from "./group-expense-ui.test-helpers";

const memberIds = buildMembers().map((member) => member.uid);

interface LoadOverrides {
  expense?: Partial<GroupExpense>;
  wallets?: Wallet[];
  walletsLoading?: boolean;
  walletsError?: string | null;
  viewerUid?: string;
}

function loadValues({
  expense = {},
  wallets = [],
  walletsLoading = false,
  walletsError = null,
  viewerUid = VIEWER,
}: LoadOverrides = {}) {
  return getGroupExpenseInitialValues({
    editingExpense: buildExpense(expense),
    viewerUid,
    groupId: "",
    memberIds,
    groupCurrency: "USD",
    today: TODAY,
    wallets,
    walletsLoading,
    walletsError,
    defaultRegisterInWallet: true,
  });
}

describe("getGroupExpenseInitialValues (edit)", () => {
  it("maps a stored equal expense with its shares as fixed values", () => {
    const values = loadValues();

    expect(values).toMatchObject({
      groupId: GROUP_ID,
      amount: "10.00",
      currency: "EUR",
      date: "2026-11-08",
      dateText: "08/11/2026",
      payerId: "user-b",
      participantIds: [VIEWER, "user-b"],
      splitMode: "equal",
      description: "Cena",
    });
    expect(values.splitValues.fixed).toEqual({
      [VIEWER]: "5.00",
      "user-b": "5.00",
    });
  });

  it("keeps the stored percentage of its mode", () => {
    const values = loadValues({
      expense: {
        splitMode: "percentage",
        participants: [
          { userId: VIEWER, shareCents: 700, percentageBps: 7000 },
          { userId: "user-b", shareCents: 300, percentageBps: 3000 },
        ],
      },
    });

    expect(values.splitMode).toBe("percentage");
    expect(values.splitValues.percentage).toEqual({
      [VIEWER]: "70",
      "user-b": "30",
    });
  });

  it("maps the weights of a shares expense", () => {
    const values = loadValues({
      expense: {
        splitMode: "shares",
        participants: [
          { userId: VIEWER, shareCents: 667, weight: 2 },
          { userId: "user-b", shareCents: 333, weight: 1 },
        ],
      },
    });

    expect(values.splitValues.shares).toEqual({
      [VIEWER]: "2",
      "user-b": "1",
    });
  });

  it("drops stored participants that are no longer members", () => {
    const values = loadValues({
      expense: {
        participants: [
          { userId: VIEWER, shareCents: 500 },
          { userId: "user-z", shareCents: 500 },
        ],
      },
    });

    expect(values.participantIds).toEqual([VIEWER]);
  });

  it("falls back to the viewer when the stored payer is no longer a member", () => {
    const values = loadValues({ expense: { payerId: "user-z" } });

    expect(values.payerId).toBe(VIEWER);
  });

  it("derives the toggle from the stored link, not from the profile", () => {
    const social = loadValues();
    const linked = loadValues({
      expense: {
        payerId: VIEWER,
        walletId: "wallet-1",
        categoryId: "category-1",
        linkedTransactionId: "transaction-1",
      },
      wallets: [buildWallet()],
    });

    expect(social.registerInWallet).toBe(false);
    expect(linked).toMatchObject({
      walletId: "wallet-1",
      categoryId: "category-1",
      registerInWallet: true,
    });
  });

  it("keeps a stored wallet that is only archived, not deleted", () => {
    const values = loadValues({
      expense: {
        payerId: VIEWER,
        walletId: "wallet-1",
        categoryId: "category-1",
      },
      wallets: [buildWallet({ archivedAt: "2026-11-09T10:00:00.000Z" })],
    });

    expect(values.walletId).toBe("wallet-1");
    expect(values.categoryId).toBe("category-1");
  });

  it("clears a wallet the loaded list no longer holds", () => {
    const values = loadValues({
      expense: {
        payerId: VIEWER,
        walletId: "wallet-gone",
        categoryId: "category-1",
      },
      wallets: [buildWallet({ id: "wallet-1" })],
    });

    expect(values.walletId).toBe("");
    expect(values.categoryId).toBe("");
    expect(values.registerInWallet).toBe(true);
  });

  it("never clears the wallet while the list is loading or failed", () => {
    const loading = loadValues({
      expense: { payerId: VIEWER, walletId: "wallet-gone" },
      wallets: [],
      walletsLoading: true,
    });
    const failed = loadValues({
      expense: { payerId: VIEWER, walletId: "wallet-gone" },
      wallets: [],
      walletsError: "No connection",
    });

    expect(loading.walletId).toBe("wallet-gone");
    expect(failed.walletId).toBe("wallet-gone");
  });

  it("drops a missing stored category of a survivor wallet", () => {
    const values = loadValues({
      expense: {
        payerId: VIEWER,
        walletId: "wallet-1",
        categoryId: null,
      },
      wallets: [buildWallet({ id: "wallet-1" })],
    });

    expect(values.walletId).toBe("wallet-1");
    expect(values.categoryId).toBe("");
  });

  it("drops a stored category when there is no wallet", () => {
    const values = loadValues({
      expense: { payerId: VIEWER, walletId: null, categoryId: "category-1" },
    });

    expect(values.walletId).toBe("");
    expect(values.categoryId).toBe("");
  });
});
