import { isCurrencyCode } from "@/shared/constants/currencies";
import type { Result } from "@/shared/types/common.types";
import { getTodayIsoDate, parseDateInput } from "@/shared/utils/date";

import type {
  SettlementInput,
  ValidatedSettlement,
} from "../types/settlement.types";
import { amountToCents } from "@/features/shared-expenses/utils/expense-amount";
import {
  SETTLEMENT_AMOUNT_MAX_CENTS,
  SETTLEMENT_NOTE_MAX_LENGTH,
  type SettlementFieldErrors,
  type SettlementValidationIssue,
} from "./settlement-validation.types";

export {
  SETTLEMENT_AMOUNT_MAX,
  SETTLEMENT_AMOUNT_MAX_CENTS,
  SETTLEMENT_NOTE_MAX_LENGTH,
  type SettlementFieldErrors,
  type SettlementFormField,
  type SettlementValidationCode,
  type SettlementValidationIssue,
} from "./settlement-validation.types";

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalId(value: unknown): string | null {
  const text = readText(value);
  return text.length > 0 ? text : null;
}

/**
 * Validates the settlement form and returns the normalized payload. The
 * direction and the debt bound need the pair ledger, so they belong to the
 * service; a wallet supplied by the debtor is rejected there too, because only
 * the creditor may link one.
 */
export function validateSettlementInput(
  input: SettlementInput,
  viewerUid: string,
  today: string = getTodayIsoDate(),
): Result<ValidatedSettlement, SettlementValidationIssue[]> {
  const issues: SettlementValidationIssue[] = [];
  const viewer = readText(viewerUid);
  const friendUid = readText(input.friendUid);

  if (friendUid.length === 0 || friendUid === viewer) {
    issues.push({ field: "friendUid", code: "FRIEND_NOT_FOUND" });
  }

  const rawAmount = readText(input.amount);
  const amountCents = rawAmount.length === 0 ? null : amountToCents(rawAmount);

  if (rawAmount.length === 0) {
    issues.push({ field: "amount", code: "AMOUNT_REQUIRED" });
  } else if (amountCents === null) {
    issues.push({ field: "amount", code: "AMOUNT_INVALID" });
  } else if (amountCents > SETTLEMENT_AMOUNT_MAX_CENTS) {
    issues.push({ field: "amount", code: "AMOUNT_TOO_HIGH" });
  }

  const currency = input.currency;
  if (!isCurrencyCode(currency)) {
    issues.push({ field: "currency", code: "CURRENCY_INVALID" });
  }

  const date = parseDateInput(input.date);
  if (date === null) {
    issues.push({ field: "date", code: "DATE_INVALID" });
  } else if (today.length > 0 && date > today) {
    // A settlement dates the transfer that already happened, so it can never
    // be in the future. ISO dates compare lexicographically.
    issues.push({ field: "date", code: "DATE_IN_FUTURE" });
  }

  const note = readText(input.note);
  if (note.length > SETTLEMENT_NOTE_MAX_LENGTH) {
    issues.push({ field: "note", code: "NOTE_TOO_LONG" });
  }

  const walletId = readOptionalId(input.walletId);
  const categoryId = walletId === null ? null : readOptionalId(input.categoryId);

  if (walletId !== null && categoryId === null) {
    issues.push({ field: "categoryId", code: "CATEGORY_REQUIRED" });
  }

  if (
    issues.length > 0 ||
    amountCents === null ||
    date === null ||
    !isCurrencyCode(currency)
  ) {
    return { ok: false, error: issues };
  }

  return {
    ok: true,
    value: {
      friendUid,
      amountCents,
      currency,
      date,
      note,
      walletId,
      categoryId,
    },
  };
}

/** First issue per field, so the form renders one message per input. */
export function toSettlementFieldErrors(
  issues: readonly SettlementValidationIssue[],
): SettlementFieldErrors {
  return issues.reduce<SettlementFieldErrors>((errors, issue) => {
    if (!errors[issue.field]) errors[issue.field] = issue.code;

    return errors;
  }, {});
}
