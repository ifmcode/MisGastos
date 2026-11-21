import { amountToCents } from "@/features/shared-expenses/utils/expense-amount";
import type { FriendBalance } from "@/features/friends/types/friend.types";
import { getTodayIsoDate, parseDateInput } from "@/shared/utils/date";

import type { Settlement, SettlementInput } from "../types/settlement.types";
import {
  getCurrencyNetBalanceCents,
  getSettlementDebtorCreditor,
} from "./settlement-debt";
import { getSettlementCurrencyOption } from "./settlement-form-currency";
import type {
  SettlementCurrencyOption,
  SettlementFormValues,
} from "./settlement-form.types";

function toCents(value: number): number {
  return Number.isFinite(value) ? Math.round(value) : 0;
}

/**
 * Amount issue the form can detect without the ledger: an empty, malformed or
 * zero amount, or one above the outstanding debt of the selected currency.
 */
export function getSettlementAmountIssue(
  values: SettlementFormValues,
  debtCents: number,
): "AMOUNT_REQUIRED" | "AMOUNT_INVALID" | "AMOUNT_EXCEEDS_DEBT" | null {
  const trimmed = values.amount.trim();
  if (trimmed.length === 0) return "AMOUNT_REQUIRED";

  const cents = amountToCents(trimmed);
  if (cents === null) return "AMOUNT_INVALID";
  if (cents > toCents(debtCents)) return "AMOUNT_EXCEEDS_DEBT";

  return null;
}

/**
 * Date issue the form can detect before the network: an unparseable value or a
 * future transfer date. A settlement dates money that already moved, so today
 * and any past day are valid.
 */
export function getSettlementDateIssue(
  values: SettlementFormValues,
  today: string = getTodayIsoDate(),
): "DATE_INVALID" | "DATE_IN_FUTURE" | null {
  const date = parseDateInput(values.date.trim() || values.dateText);

  if (date === null) return "DATE_INVALID";
  if (today.length > 0 && date > today) return "DATE_IN_FUTURE";

  return null;
}

/**
 * Direction of the currency being edited. A settlement keeps its stored
 * direction; the create path derives it from the signed net.
 */
export function getSettlementFormDirection({
  values,
  options,
  settlement,
}: {
  values: SettlementFormValues;
  options: readonly SettlementCurrencyOption[];
  settlement?: Settlement | null;
}): "viewer-owes-friend" | "friend-owes-viewer" | null {
  if (settlement) {
    return settlement.fromUserId === values.viewerUid
      ? "viewer-owes-friend"
      : "friend-owes-viewer";
  }

  return getSettlementCurrencyOption(options, values.currency)?.direction ?? null;
}

/** Only the creditor may send a wallet; the debtor never links one. */
export function toSettlementInput(
  values: SettlementFormValues,
  viewerIsCreditor: boolean,
): SettlementInput {
  const walletId = viewerIsCreditor ? values.walletId.trim() : "";

  return {
    friendUid: values.friendUid,
    currency: values.currency,
    amount: values.amount,
    date: values.date,
    note: values.note,
    walletId,
    categoryId: walletId.length > 0 ? values.categoryId : "",
  };
}

/** Create-mode direction helper, kept here so screens do not import two utils. */
export function getCreateDirection({
  values,
  viewerUid,
  balances,
}: {
  values: SettlementFormValues;
  viewerUid: string;
  balances: readonly FriendBalance[];
}) {
  return getSettlementDebtorCreditor({
    viewerUid,
    friendUid: values.friendUid,
    netBalanceCents: getCurrencyNetBalanceCents(balances, values.currency),
  });
}
