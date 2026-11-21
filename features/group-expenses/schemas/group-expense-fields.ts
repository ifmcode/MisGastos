import { isCurrencyCode, type CurrencyCode } from "@/shared/constants/currencies";
import { parseDateInput } from "@/shared/utils/date";

import { amountToCents } from "@/features/shared-expenses/utils/expense-amount";
import { isExpenseSplitMode } from "@/features/shared-expenses/utils/expense-split";

import {
  GROUP_EXPENSE_AMOUNT_MAX_CENTS,
  GROUP_EXPENSE_DESCRIPTION_MAX_LENGTH,
  type ExpenseSplitMode,
  type GroupExpenseInput,
} from "../types/group-expense.types";
import {
  readParticipantIds,
  readPayerId,
} from "./group-expense-participants";
import { readText } from "./group-expense-text";
import type {
  GroupExpenseValidationIssue,
  ParsedGroupExpense,
} from "./group-expense-validation.types";

function readGroupId(
  value: unknown,
  issues: GroupExpenseValidationIssue[],
): string | null {
  const groupId = readText(value);

  if (groupId.length === 0) {
    issues.push({ field: "groupId", code: "GROUP_REQUIRED" });
    return null;
  }

  return groupId;
}

function readDescription(
  value: unknown,
  issues: GroupExpenseValidationIssue[],
): string | null {
  const description = readText(value);

  if (description.length === 0) {
    issues.push({ field: "description", code: "DESCRIPTION_REQUIRED" });
    return null;
  }

  if (description.length > GROUP_EXPENSE_DESCRIPTION_MAX_LENGTH) {
    issues.push({ field: "description", code: "DESCRIPTION_TOO_LONG" });
    return null;
  }

  return description;
}

function readAmountCents(
  value: unknown,
  issues: GroupExpenseValidationIssue[],
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

  if (cents > GROUP_EXPENSE_AMOUNT_MAX_CENTS) {
    issues.push({ field: "amount", code: "AMOUNT_TOO_HIGH" });
    return null;
  }

  return cents;
}

function readDate(
  value: unknown,
  issues: GroupExpenseValidationIssue[],
): string | null {
  const date = parseDateInput(readText(value));

  if (date !== null) return date;

  issues.push({ field: "date", code: "DATE_INVALID" });
  return null;
}

function readCurrency(
  value: unknown,
  issues: GroupExpenseValidationIssue[],
): CurrencyCode | null {
  if (isCurrencyCode(value)) return value;

  issues.push({ field: "currency", code: "CURRENCY_INVALID" });
  return null;
}

function readSplitMode(
  value: unknown,
  issues: GroupExpenseValidationIssue[],
): ExpenseSplitMode | null {
  if (isExpenseSplitMode(value)) return value;

  issues.push({ field: "splitMode", code: "SPLIT_MODE_INVALID" });
  return null;
}

/** Collects every field issue of a group expense in display order. */
export function parseGroupExpenseFields(
  input: GroupExpenseInput,
  members: readonly string[],
  issues: GroupExpenseValidationIssue[],
): ParsedGroupExpense | null {
  const groupId = readGroupId(input.groupId, issues);
  const description = readDescription(input.description, issues);
  const amountCents = readAmountCents(input.amount, issues);
  const date = readDate(input.date, issues);
  const currency = readCurrency(input.currency, issues);
  const splitMode = readSplitMode(input.splitMode, issues);
  readParticipantIds(input, members, issues);
  const payerId = readPayerId(input.payerId, members, issues);

  if (
    groupId === null ||
    description === null ||
    amountCents === null ||
    date === null ||
    currency === null ||
    splitMode === null ||
    payerId === null
  ) {
    return null;
  }

  return {
    groupId,
    description,
    amountCents,
    date,
    currency,
    splitMode,
    payerId,
  };
}
