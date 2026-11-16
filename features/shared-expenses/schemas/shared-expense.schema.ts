import type { Result } from "@/shared/types/common.types";

import type {
  SharedExpenseInput,
  ValidatedSharedExpense,
} from "../types/shared-expense.types";
import { splitExpenseAmount } from "../utils/expense-split";
import { parseSplitParticipants } from "../utils/expense-split-values";
import { parseSharedExpenseFields } from "./shared-expense-field-validation";
import {
  type SharedExpenseFieldErrors,
  type SharedExpenseValidationIssue,
} from "./shared-expense-validation.types";

export {
  SHARED_EXPENSE_AMOUNT_MAX,
  SHARED_EXPENSE_DESCRIPTION_MAX_LENGTH,
  type SharedExpenseFieldErrors,
  type SharedExpenseFormField,
  type SharedExpenseValidationCode,
  type SharedExpenseValidationIssue,
} from "./shared-expense-validation.types";

/**
 * Validates the shared-expense form and returns the normalized payload the
 * service persists: integer cents, sorted ids and exact shares. Friendship is
 * checked by the service, not here.
 */
export function validateSharedExpenseInput(
  input: SharedExpenseInput,
  viewerUid: string,
): Result<ValidatedSharedExpense, SharedExpenseValidationIssue[]> {
  const issues: SharedExpenseValidationIssue[] = [];
  const parsed = parseSharedExpenseFields(input, viewerUid, issues);

  if (parsed === null) return { ok: false, error: issues };

  const values = parseSplitParticipants(parsed.splitMode, input.participants);

  if (!values.ok) {
    return { ok: false, error: [{ field: "participants", code: values.error }] };
  }

  const shares = splitExpenseAmount(
    parsed.amountCents,
    parsed.splitMode,
    values.value,
  );

  if (!shares.ok) {
    return { ok: false, error: [{ field: "participants", code: shares.error }] };
  }

  return {
    ok: true,
    value: {
      participantIds: parsed.participantIds,
      payerId: parsed.payerId,
      amountCents: parsed.amountCents,
      currency: parsed.currency,
      splitMode: parsed.splitMode,
      participants: shares.value,
      description: parsed.description,
      date: parsed.date,
    },
  };
}

export function toSharedExpenseFieldErrors(
  issues: readonly SharedExpenseValidationIssue[],
): SharedExpenseFieldErrors {
  return issues.reduce<SharedExpenseFieldErrors>((errors, issue) => {
    if (!errors[issue.field]) {
      errors[issue.field] = issue.code;
    }

    return errors;
  }, {});
}
