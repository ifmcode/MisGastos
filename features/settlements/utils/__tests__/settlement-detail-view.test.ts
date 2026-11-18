import { describe, expect, it } from "@jest/globals";

import type { SettlementDetailContext } from "../settlement-detail-view";
import {
  getSettlementDetailFields,
  getSettlementDetailSubtitle,
  getSettlementDetailSummary,
} from "../settlement-detail-view";
import { buildSettlement } from "./settlement.fixtures";

// The fixture is Ana (debtor) -> Bea (creditor), so `user-b` is the creditor.
const creditorContext: SettlementDetailContext = {
  viewerUid: "user-b",
  viewerName: "Bea",
  friendName: "Ana",
  walletName: null,
  walletArchived: false,
  formatCurrency: (value, currency) => `${value.toFixed(2)} ${currency}`,
  formatDate: () => "10/11/2026",
  formatDateTime: () => "10/11/2026 20:00",
  t: (key: string, options?: Record<string, unknown>) =>
    options ? `${key}:${JSON.stringify(options)}` : key,
};

const debtorContext: SettlementDetailContext = {
  ...creditorContext,
  viewerUid: "user-a",
  viewerName: "Ana",
  friendName: "Bea",
};

function fieldKeys(
  settlement = buildSettlement(),
  context = creditorContext,
): string[] {
  return getSettlementDetailFields(settlement, context).map(
    (field) => field.key,
  );
}

describe("getSettlementDetailSubtitle", () => {
  it("speaks from the viewer's side", () => {
    expect(
      getSettlementDetailSubtitle(buildSettlement(), creditorContext),
    ).toContain("message.youReceived");
    expect(
      getSettlementDetailSubtitle(buildSettlement(), debtorContext),
    ).toContain("message.youPaid");
  });
});

describe("getSettlementDetailSummary", () => {
  it("converts cents once and keeps the currency as meta", () => {
    expect(
      getSettlementDetailSummary(buildSettlement(), creditorContext),
    ).toEqual({
      label: "detail.title",
      amount: "10.00 EUR",
      meta: "EUR",
      tone: "neutral",
    });
  });
});

describe("getSettlementDetailFields", () => {
  it("never shows the income wallet to the debtor", () => {
    const keys = fieldKeys(buildSettlement(), debtorContext);

    expect(keys).toContain("direction");
    expect(keys).not.toContain("receiverWallet");
    expect(keys).not.toContain("receiverMovement");
  });

  it("shows the creditor an empty wallet, an archived one and the linked income", () => {
    const empty = getSettlementDetailFields(
      buildSettlement(),
      creditorContext,
    ).find((field) => field.key === "receiverWallet");
    expect(empty?.value).toBe("detail.receiverWalletNone");

    const archived = getSettlementDetailFields(
      buildSettlement({ receiverWalletId: "wallet-1" }),
      { ...creditorContext, walletName: "Banco", walletArchived: true },
    ).find((field) => field.key === "receiverWallet");
    expect(archived?.value).toBe("Banco · detail.walletArchived");

    const linked = fieldKeys(
      buildSettlement({
        receiverWalletId: "wallet-1",
        receiverTransactionId: "movement-1",
      }),
    );
    expect(linked).toContain("receiverWallet");
    expect(linked).toContain("receiverMovement");
  });
});
