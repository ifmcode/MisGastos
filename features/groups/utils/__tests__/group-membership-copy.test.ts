import { describe, expect, it } from "@jest/globals";

import type { Translate } from "@/shared/i18n/translate";

import {
  getBlockedBalanceDialogCopy,
  getCancelInvitationDialogCopy,
  getLeaveDialogCopy,
  getRemoveDialogCopy,
  getTransferDialogCopy,
} from "../group-membership-copy";

function createTranslate() {
  const calls: Array<{ key: string; options?: Record<string, unknown> }> = [];
  const tr: Translate = (key, options) => {
    calls.push({ key, options });
    return key;
  };

  return { tr, calls };
}

const formatAmount = (netCents: number, currency: string) =>
  `${netCents / 100} ${currency}`;

describe("membership dialog copy", () => {
  it("builds the removal confirmation with the member name", () => {
    const { tr, calls } = createTranslate();
    const copy = getRemoveDialogCopy("Ana", tr);

    expect(copy).toEqual({
      title: "details.removeDialogTitle",
      message: "details.removeDialogMessage",
      confirmLabel: "details.removeDialogConfirm",
      cancelLabel: "details.removeDialogCancel",
    });
    expect(calls[1].options).toEqual({ name: "Ana" });
  });

  it("builds the invitation cancellation with the invitee name", () => {
    const { tr, calls } = createTranslate();

    getCancelInvitationDialogCopy("Luis", tr);

    expect(calls[1].key).toBe("details.cancelInvitationDialogMessage");
    expect(calls[1].options).toEqual({ name: "Luis" });
  });

  it("builds the leave confirmation with the group name", () => {
    const { tr, calls } = createTranslate();
    const copy = getLeaveDialogCopy("Viaje", tr);

    expect(copy.title).toBe("details.leaveDialogTitle");
    expect(calls[1].options).toEqual({ group: "Viaje" });
    expect(copy.confirmLabel).toBe("details.leaveDialogConfirm");
  });

  it("builds the transfer confirmation with the new owner name", () => {
    const { tr, calls } = createTranslate();

    getTransferDialogCopy("Ana", tr);

    expect(calls[1].key).toBe("details.transferDialogMessage");
    expect(calls[1].options).toEqual({ name: "Ana" });
  });
});

describe("getBlockedBalanceDialogCopy", () => {
  const balances = [
    { currency: "EUR" as const, netCents: -1250 },
    { currency: "USD" as const, netCents: 800 },
  ];

  it("lists each currency with its direction for a removed member", () => {
    const { tr, calls } = createTranslate();
    const copy = getBlockedBalanceDialogCopy(
      { variant: "member", name: "Ana", balances, formatAmount },
      tr,
    );

    expect(copy.title).toBe("details.blockedBalanceTitle");
    expect(copy.message).toBe(
      [
        "details.blockedBalanceIntro",
        "details.blockedBalanceMemberOwes",
        "details.blockedBalanceGroupOwes",
      ].join("\n"),
    );
    expect(copy.confirmLabel).toBe("details.blockedBalanceConfirm");
    expect(copy.cancelLabel).toBe("details.blockedBalanceCancel");
    expect(calls[0].options).toEqual({ name: "Ana" });
    expect(calls[1].options).toEqual({ name: "Ana", amount: "12.5 EUR" });
    expect(calls[2].options).toEqual({ name: "Ana", amount: "8 USD" });
  });

  it("speaks to the viewer who wants to leave", () => {
    const { tr, calls } = createTranslate();
    const copy = getBlockedBalanceDialogCopy(
      { variant: "viewer", balances, formatAmount },
      tr,
    );

    expect(copy.message).toBe(
      [
        "details.blockedLeaveIntro",
        "details.blockedLeaveOwes",
        "details.blockedLeaveGroupOwes",
      ].join("\n"),
    );
    expect(calls[0].options).toBeUndefined();
    expect(calls[1].options).toEqual({ amount: "12.5 EUR" });
    expect(calls[2].options).toEqual({ amount: "8 USD" });
  });

  it("falls back to the unknown-member copy without a name", () => {
    const { tr, calls } = createTranslate();

    getBlockedBalanceDialogCopy(
      {
        variant: "member",
        balances: [{ currency: "EUR", netCents: -100 }],
        formatAmount,
      },
      tr,
    );

    expect(calls[0].key).toBe("history.unknownMember");
    expect(calls[1].options).toEqual({ name: "history.unknownMember" });
    expect(calls[2].options).toEqual({
      name: "history.unknownMember",
      amount: "1 EUR",
    });
  });});
