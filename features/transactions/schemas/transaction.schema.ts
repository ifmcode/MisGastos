import { Result } from "@/shared/types/common.types";
import { parseAmountInput } from "@/features/wallets/schemas/wallet-amount";

import {
  CreateTransactionDto,
  TransactionType,
} from "../types/transaction.types";
import { parseDateInput } from "../utils/transaction-date";
import { getTransactionIssues } from "./transaction-field-validation";
import {
  TransactionInput,
  TransactionValidationErrors,
  TransactionValidationIssue,
} from "./transaction-validation.types";

export {
  TRANSACTION_AMOUNT_MAX,
  TRANSACTION_CONCEPT_MAX_LENGTH,
  TRANSACTION_NOTES_MAX_LENGTH,
  type TransactionFormField,
  type TransactionInput,
  type TransactionValidationCode,
  type TransactionValidationErrors,
  type TransactionValidationIssue,
} from "./transaction-validation.types";

export function validateTransactionInput(
  input: TransactionInput,
): Result<CreateTransactionDto, TransactionValidationIssue[]> {
  const issues = getTransactionIssues(input);

  if (issues.length > 0) {
    return { ok: false, error: issues };
  }

  const notes = typeof input.notes === "string" ? input.notes.trim() : "";

  return {
    ok: true,
    value: {
      type: input.type as TransactionType,
      amount: parseAmountInput(input.amount) ?? 0,
      currency: input.currency as CreateTransactionDto["currency"],
      walletId: input.walletId.trim(),
      categoryId: input.categoryId,
      concept: input.concept.trim(),
      ...(notes.length > 0 ? { notes } : {}),
      date: parseDateInput(input.date) ?? "",
    },
  };
}

export function toTransactionFieldErrors(
  issues: readonly TransactionValidationIssue[],
): TransactionValidationErrors {
  return issues.reduce<TransactionValidationErrors>((errors, issue) => {
    if (!errors[issue.field]) {
      errors[issue.field] = issue.message;
    }
    return errors;
  }, {});
}
