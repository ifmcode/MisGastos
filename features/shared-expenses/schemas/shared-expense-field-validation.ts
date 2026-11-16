import { isCurrencyCode, type CurrencyCode } from "@/shared/constants/currencies";
import { parseDateInput } from "@/shared/utils/date";

import type {
  ExpenseSplitMode,
  SharedExpenseInput,
} from "../types/shared-expense.types";
import { amountToCents } from "../utils/expense-amount";
import { isExpenseSplitMode } from "../utils/expense-split";
import { readParticipantIds, readPayerId } from "./shared-expense-participants";
import {
  SHARED_EXPENSE_AMOUNT_MAX,
  SHARED_EXPENSE_DESCRIPTION_MAX_LENGTH,
  type SharedExpenseValidationIssue,
} from "./shared-expense-validation.types";

const AMOUNT_MAX_CENTS = SHARED_EXPENSE_AMOUNT_MAX * 100;

/** Fields that survived validation, before the exact split is computed. */
export interface ParsedSharedExpense {
  description: string;
  amountCents: number;
  currency: CurrencyCode;
  date: string;
  payerId: string;
  participantIds: string[];
  splitMode: ExpenseSplitMode;
  walletId: string | null;
  categoryId: string | null;
}

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Optional ids are trimmed; an empty string means "not selected". */
function readOptionalId(value: unknown): string | null {
  const id = readText(value);
  return id.length > 0 ? id : null;
}

function readDescription(
  value: unknown,
  issues: SharedExpenseValidationIssue[],
): string | null {
  const description = readText(value);

  if (description.length === 0) {
    issues.push({ field: "description", code: "DESCRIPTION_REQUIRED" });
    return null;
  }

  if (description.length > SHARED_EXPENSE_DESCRIPTION_MAX_LENGTH) {
    issues.push({ field: "description", code: "DESCRIPTION_TOO_LONG" });
    return null;
  }

  return description;
}

function readAmountCents(
  value: unknown,
  issues: SharedExpenseValidationIssue[],
): number | null {
  const cents = amountToCents(value);

  if (cents === null) {
    const isEmpty = readText(value).length === 0;
    issues.push({
      field: "amount",
      code: isEmpty ? "AMOUNT_REQUIRED" : "AMOUNT_INVALID",
    });
    return null;
  }

  if (cents > AMOUNT_MAX_CENTS) {
    issues.push({ field: "amount", code: "AMOUNT_TOO_HIGH" });
    return null;
  }

  return cents;
}

function readDate(
  value: unknown,
  issues: SharedExpenseValidationIssue[],
): string | null {
  const date = parseDateInput(readText(value));

  if (date !== null) return date;

  issues.push({ field: "date", code: "DATE_INVALID" });
  return null;
}

function readCurrency(
  value: unknown,
  issues: SharedExpenseValidationIssue[],
): CurrencyCode | null {
  if (isCurrencyCode(value)) return value;

  issues.push({ field: "currency", code: "CURRENCY_INVALID" });
  return null;
}

function readSplitMode(
  value: unknown,
  issues: SharedExpenseValidationIssue[],
): ExpenseSplitMode | null {
  if (isExpenseSplitMode(value)) return value;

  issues.push({ field: "splitMode", code: "SPLIT_MODE_INVALID" });
  return null;
}

/**
 * Collects every field issue of a shared expense in display order. Friendship
 * is deliberately not checked here: persistence owns that guard.
 */
export function parseSharedExpenseFields(
  input: SharedExpenseInput,
  viewerUid: string,
  issues: SharedExpenseValidationIssue[],
): ParsedSharedExpense | null {
  const description = readDescription(input.description, issues);
  const amountCents = readAmountCents(input.amount, issues);
  const date = readDate(input.date, issues);
  const currency = readCurrency(input.currency, issues);
  const splitMode = readSplitMode(input.splitMode, issues);
  const participantIds = readParticipantIds(input, viewerUid, issues);
  const payerId = readPayerId(input.payerId, participantIds, issues);
  const walletId = readOptionalId(input.walletId);
  // No wallet means no personal movement, so the category cannot survive alone.
  const categoryId = walletId === null ? null : readOptionalId(input.categoryId);

  if (
    description === null ||
    amountCents === null ||
    date === null ||
    currency === null ||
    splitMode === null ||
    participantIds === null ||
    payerId === null
  ) {
    return null;
  }

  return {
    description,
    amountCents,
    currency,
    date,
    payerId,
    participantIds,
    splitMode,
    walletId,
    categoryId,
  };
}
