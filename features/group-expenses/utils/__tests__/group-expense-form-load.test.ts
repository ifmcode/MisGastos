import { describe, expect, it } from "@jest/globals";

import { getGroupExpenseInitialValues } from "../group-expense-form-load";
import {
  buildMembers,
  buildWallet,
  GROUP_ID,
  TODAY,
  VIEWER,
} from "./group-expense-ui.test-helpers";

const memberIds = buildMembers().map((member) => member.uid);

describe("getGroupExpenseInitialValues (create)", () => {
  it("builds the create defaults of the group", () => {
    const values = getGroupExpenseInitialValues({
      editingExpense: null,
      viewerUid: VIEWER,
      groupId: GROUP_ID,
      memberIds,
      groupCurrency: "USD",
      today: TODAY,
      wallets: [],
      walletsLoading: false,
      walletsError: null,
      defaultRegisterInWallet: false,
    });

    expect(values).toMatchObject({
      groupId: GROUP_ID,
      currency: "USD",
      date: TODAY,
      dateText: "10/11/2026",
      payerId: VIEWER,
      participantIds: memberIds,
      splitMode: "equal",
      amount: "",
      description: "",
      walletId: "",
      categoryId: "",
      registerInWallet: false,
    });
  });

  it("picks the first member as payer when the viewer is not one", () => {
    const values = getGroupExpenseInitialValues({
      editingExpense: null,
      viewerUid: "user-z",
      groupId: GROUP_ID,
      memberIds: ["user-b", "user-c"],
      groupCurrency: "EUR",
      today: TODAY,
      wallets: [],
      walletsLoading: false,
      walletsError: null,
      defaultRegisterInWallet: false,
    });

    expect(values.payerId).toBe("user-b");
    expect(values.participantIds).toEqual(["user-b", "user-c"]);
  });

  it("defaults the registration toggle from the profile preference", () => {
    const enabled = getGroupExpenseInitialValues({
      editingExpense: null,
      viewerUid: VIEWER,
      groupId: GROUP_ID,
      memberIds,
      groupCurrency: "EUR",
      today: TODAY,
      wallets: [buildWallet()],
      walletsLoading: false,
      walletsError: null,
      defaultRegisterInWallet: true,
    });
    const disabled = getGroupExpenseInitialValues({
      editingExpense: null,
      viewerUid: VIEWER,
      groupId: GROUP_ID,
      memberIds,
      groupCurrency: "EUR",
      today: TODAY,
      wallets: [buildWallet()],
      walletsLoading: false,
      walletsError: null,
      defaultRegisterInWallet: false,
    });

    expect(enabled.registerInWallet).toBe(true);
    expect(enabled.walletId).toBe("");
    expect(enabled.categoryId).toBe("");
    expect(disabled.registerInWallet).toBe(false);
  });
});
