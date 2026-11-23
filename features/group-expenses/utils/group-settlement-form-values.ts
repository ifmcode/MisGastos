import type {
  GroupSettlement,
  GroupSettlementInput,
} from "../types/group-settlement.types";
import type {
  GroupSettlementEditDefaults,
  GroupSettlementFormDefaults,
  GroupSettlementFormValues,
} from "./group-settlement-form.types";

function toCents(value: number): number {
  return Number.isFinite(value) ? Math.round(value) : 0;
}

/** `12.34` for the amount input; the parser accepts the comma too. */
export function formatGroupSettlementAmountInput(cents: number): string {
  return (toCents(cents) / 100).toFixed(2);
}

/** Create defaults: the canonical pair, the full debt and today. */
export function createGroupSettlementFormValues({
  viewerUid,
  groupId,
  debt,
  today,
}: GroupSettlementFormDefaults): GroupSettlementFormValues {
  return {
    viewerUid,
    groupId,
    currency: debt.currency,
    fromUserId: debt.fromUserId,
    toUserId: debt.toUserId,
    amount: formatGroupSettlementAmountInput(debt.amountCents),
    date: today,
    note: "",
    walletId: "",
    categoryId: "",
  };
}

/** Edit defaults: the stored pair, amount, date, note and creditor link. */
export function createGroupSettlementEditFormValues({
  settlement,
  viewerUid,
  today,
}: GroupSettlementEditDefaults): GroupSettlementFormValues {
  const viewerIsCreditor = settlement.toUserId === viewerUid;

  return {
    viewerUid,
    groupId: settlement.groupId,
    currency: settlement.currency,
    fromUserId: settlement.fromUserId,
    toUserId: settlement.toUserId,
    amount: formatGroupSettlementAmountInput(settlement.amountCents),
    date: settlement.date || today,
    note: settlement.note,
    walletId: viewerIsCreditor ? (settlement.receiverWalletId ?? "") : "",
    categoryId: viewerIsCreditor
      ? (settlement.receiverCategoryId ?? "")
      : "",
  };
}

/** Clearing the wallet also clears the category, so no stale link survives. */
export function selectGroupSettlementWallet(
  values: GroupSettlementFormValues,
  walletId: string,
): GroupSettlementFormValues {
  const trimmed = walletId.trim();

  return {
    ...values,
    walletId: trimmed,
    categoryId: trimmed.length > 0 ? values.categoryId : "",
  };
}

/** Only the creditor may send a wallet; the debtor never links one. */
export function toGroupSettlementInput(
  values: GroupSettlementFormValues,
  viewerIsCreditor: boolean,
): GroupSettlementInput {
  const walletId = viewerIsCreditor ? values.walletId.trim() : "";

  return {
    groupId: values.groupId,
    fromUserId: values.fromUserId,
    toUserId: values.toUserId,
    amount: values.amount,
    currency: values.currency,
    date: values.date,
    note: values.note,
    walletId,
    categoryId: walletId.length > 0 ? values.categoryId : "",
  };
}
