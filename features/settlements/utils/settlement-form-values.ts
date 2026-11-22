import { formatDateInput } from "@/shared/utils/date";

import type { Settlement } from "../types/settlement.types";
import {
  formatSettlementAmountInput,
  getSettlementCurrencyOption,
  getSettlementCurrencyOptions,
} from "./settlement-form-currency";
import type {
  SettlementFormDefaults,
  SettlementFormValues,
} from "./settlement-form.types";

/**
 * Create defaults: the currency chosen in the debt step, its full outstanding
 * debt and today. It returns `null` when that currency has no debt, so a forged
 * or stale choice never settles a defaulted currency. The amount stays
 * editable; it is only a starting point.
 */
export function createSettlementFormValues({
  viewerUid,
  friendUid,
  currency,
  balances,
  today,
}: SettlementFormDefaults): SettlementFormValues | null {
  const option = getSettlementCurrencyOption(
    getSettlementCurrencyOptions(balances),
    currency,
  );

  if (!option) return null;

  return {
    viewerUid,
    friendUid,
    currency: option.currency,
    amount: formatSettlementAmountInput(option.debtCents),
    date: today,
    dateText: formatDateInput(today),
    note: "",
    walletId: "",
    categoryId: "",
  };
}

/**
 * Edit defaults: the currency is immutable, the stored amount is prefilled and
 * the creditor's own link is preselected. The edit bound lives in
 * `useSettlementEditor`, so this builder only restores the stored state.
 */
export function createSettlementEditFormValues({
  settlement,
  viewerUid,
  today,
}: {
  settlement: Settlement;
  viewerUid: string;
  today: string;
}): SettlementFormValues {
  const viewerIsCreditor = settlement.toUserId === viewerUid;

  return {
    viewerUid,
    friendUid:
      settlement.participantIds.find((uid) => uid !== viewerUid) ?? "",
    currency: settlement.currency,
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
