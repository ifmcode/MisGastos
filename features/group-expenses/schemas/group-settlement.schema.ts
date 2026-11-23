import { isCurrencyCode } from "@/shared/constants/currencies";
import type { Result } from "@/shared/types/common.types";
import { getTodayIsoDate, parseDateInput } from "@/shared/utils/date";

import { amountToCents } from "@/features/shared-expenses/utils/expense-amount";

import type {
  GroupSettlementInput,
  ValidatedGroupSettlement,
} from "../types/group-settlement.types";
import {
  SETTLEMENT_AMOUNT_MAX_CENTS,
  SETTLEMENT_NOTE_MAX_LENGTH,
  type GroupSettlementFieldErrors,
  type GroupSettlementValidationIssue,
} from "./group-settlement-validation.types";

export {
  SETTLEMENT_AMOUNT_MAX_CENTS,
  SETTLEMENT_NOTE_MAX_LENGTH,
  type GroupSettlementFieldErrors,
  type GroupSettlementFormField,
  type GroupSettlementValidationCode,
  type GroupSettlementValidationIssue,
} from "./group-settlement-validation.types";

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalId(value: unknown): string | null {
  const text = readText(value);
  return text.length > 0 ? text : null;
}

/**
 * Validates the group settlement form and returns the normalized payload.
 *
 * The membership, the pair membership, the direction and the debt bound need
 * Firestore (group + ledger), so they belong to the service; the wallet
 * existence, ownership, currency and archived check runs inside the repository
 * transaction. Only what a pure function can prove is validated here.
 */
export function validateGroupSettlementInput(
  input: GroupSettlementInput,
  today: string = getTodayIsoDate(),
): Result<ValidatedGroupSettlement, GroupSettlementValidationIssue[]> {
  const issues: GroupSettlementValidationIssue[] = [];

  const groupId = readText(input.groupId);
  if (groupId.length === 0) {
    issues.push({ field: "groupId", code: "GROUP_REQUIRED" });
  }

  const fromUserId = readText(input.fromUserId);
  if (fromUserId.length === 0) {
    issues.push({ field: "fromUserId", code: "FROM_REQUIRED" });
  }

  const toUserId = readText(input.toUserId);
  if (toUserId.length === 0) {
    issues.push({ field: "toUserId", code: "TO_REQUIRED" });
  }

  if (
    fromUserId.length > 0 &&
    toUserId.length > 0 &&
    fromUserId === toUserId
  ) {
    issues.push({ field: "toUserId", code: "PAIR_SAME" });
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
    // A settlement dates a payment that already happened: ISO dates compare
    // lexicographically, so a future day is rejected.
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
    !isCurrencyCode(currency) ||
    groupId.length === 0 ||
    fromUserId.length === 0 ||
    toUserId.length === 0 ||
    fromUserId === toUserId
  ) {
    return { ok: false, error: issues };
  }

  return {
    ok: true,
    value: {
      groupId,
      fromUserId,
      toUserId,
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
export function toGroupSettlementFieldErrors(
  issues: readonly GroupSettlementValidationIssue[],
): GroupSettlementFieldErrors {
  return issues.reduce<GroupSettlementFieldErrors>((errors, issue) => {
    if (!errors[issue.field]) errors[issue.field] = issue.code;

    return errors;
  }, {});
}
