import type { CurrencyCode } from "@/shared/constants/currencies";
import { formatDateInput } from "@/shared/utils/date";

import type { Settlement } from "../types/settlement.types";
import {
  formatSettlementAmountInput,
  getSettlementCurrencyOption,
  getSettlementCurrencyOptions,
  getSettlementEditableNetCents,
} from "./settlement-form-currency";
import type {
  SettlementAmountMode,
  SettlementCurrencyOption,
  SettlementFormDefaults,
  SettlementFormValues,
} from "./settlement-form.types";

/** Create defaults: the first debt currency, full amount and today. */
export function createSettlementFormValues({
  viewerUid,
  friendUid,
  balances,
  today,
}: SettlementFormDefaults): SettlementFormValues | null {
  const [first] = getSettlementCurrencyOptions(balances);

  if (!first) return null;

  return {
    viewerUid,
    friendUid,
    currency: first.currency,
    mode: "total",
    amount: formatSettlementAmountInput(first.debtCents),
    date: today,
    dateText: formatDateInput(today),
    note: "",
    walletId: "",
    categoryId: "",
  };
}

/**
 * Edit defaults: the currency is immutable, the amount bound is the debt
 * excluding this settlement and the creditor's own link is preselected.
 */
export function createSettlementEditFormValues({
  settlement,
  viewerUid,
  currentNetCents,
  today,
}: {
  settlement: Settlement;
  viewerUid: string;
  currentNetCents: number;
  today: string;
}): SettlementFormValues {
  const editableNet = getSettlementEditableNetCents(
    settlement,
    viewerUid,
    currentNetCents,
  );
  const debtCents = Math.abs(Math.round(editableNet));
  const viewerIsCreditor = settlement.toUserId === viewerUid;

  return {
    viewerUid,
    friendUid:
      settlement.participantIds.find((uid) => uid !== viewerUid) ?? "",
    currency: settlement.currency,
    mode:
      debtCents > 0 && settlement.amountCents >= debtCents ? "total" : "partial",
    amount: formatSettlementAmountInput(settlement.amountCents),
    date: settlement.date || today,
    dateText: formatDateInput(settlement.date || today),
    note: settlement.note,
    walletId: viewerIsCreditor ? (settlement.receiverWalletId ?? "") : "",
    categoryId: viewerIsCreditor
      ? (settlement.receiverCategoryId ?? "")
      : "",
  };
}

/** Switching currency restores the full amount of the new debt. */
export function selectSettlementCurrency(
  values: SettlementFormValues,
  currency: CurrencyCode,
  options: readonly SettlementCurrencyOption[],
): SettlementFormValues {
  const option = getSettlementCurrencyOption(options, currency);
  const debtCents = option?.debtCents ?? 0;

  return {
    ...values,
    currency,
    amount:
      values.mode === "total"
        ? formatSettlementAmountInput(debtCents)
        : values.amount,
    walletId: "",
    categoryId: "",
  };
}

/** Switching to total always writes the full debt; partial keeps the text. */
export function selectSettlementMode(
  values: SettlementFormValues,
  mode: SettlementAmountMode,
  debtCents: number,
): SettlementFormValues {
  return {
    ...values,
    mode,
    amount:
      mode === "total"
        ? formatSettlementAmountInput(debtCents)
        : values.amount,
  };
}

/** Clearing the wallet also clears the category, so no stale link survives. */
export function selectSettlementWallet(
  values: SettlementFormValues,
  walletId: string,
  defaultCategoryId: string,
): SettlementFormValues {
  const trimmed = walletId.trim();

  return {
    ...values,
    walletId: trimmed,
    categoryId: trimmed.length > 0 ? values.categoryId || defaultCategoryId : "",
  };
}
