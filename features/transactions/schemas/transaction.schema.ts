import { isCurrencyCode } from "@/shared/constants/currencies";
import { Result } from "@/shared/types/common.types";

import { parseAmountInput } from "@/features/wallets/schemas/wallet.schema";

import {
  CreateTransactionDto,
  TransactionType,
} from "../types/transaction.types";
import { parseDateInput } from "../utils/transaction-date";
import {
  getTransactionCategory,
  isTransactionCategoryId,
  isTransactionType,
} from "../utils/transaction-options";

export const TRANSACTION_CONCEPT_MAX_LENGTH = 80;
export const TRANSACTION_NOTES_MAX_LENGTH = 300;
export const TRANSACTION_AMOUNT_MAX = 999_999_999_999.99;

export type TransactionFormField =
  | "ownerId"
  | "transactionId"
  | "type"
  | "amount"
  | "currency"
  | "walletId"
  | "categoryId"
  | "concept"
  | "notes"
  | "date";

export type TransactionValidationCode =
  | "OWNER_REQUIRED"
  | "TRANSACTION_REQUIRED"
  | "INVALID_TYPE"
  | "INVALID_AMOUNT"
  | "INVALID_CURRENCY"
  | "WALLET_REQUIRED"
  | "INVALID_CATEGORY"
  | "CATEGORY_TYPE_MISMATCH"
  | "CONCEPT_REQUIRED"
  | "CONCEPT_TOO_LONG"
  | "NOTES_TOO_LONG"
  | "INVALID_DATE";

export interface TransactionValidationIssue {
  field: TransactionFormField;
  code: TransactionValidationCode;
  message: string;
}

export type TransactionValidationErrors = Partial<
  Record<TransactionFormField, string>
>;

/**
 * Input accepted by transaction validation. Values are strings because they
 * come from forms or Firestore and must be checked at runtime.
 */
export interface TransactionInput {
  type: string;
  amount: string | number;
  currency: string;
  walletId: string;
  categoryId: string;
  concept: string;
  notes?: string | null;
  date: string;
}

export function validateTransactionInput(
  input: TransactionInput,
): Result<CreateTransactionDto, TransactionValidationIssue[]> {
  const issues: TransactionValidationIssue[] = [];

  if (!isTransactionType(input.type)) {
    issues.push({
      field: "type",
      code: "INVALID_TYPE",
      message: "Selecciona si es un gasto o un ingreso.",
    });
  }

  const amount = parseAmountInput(input.amount);
  if (amount === null || amount <= 0 || amount > TRANSACTION_AMOUNT_MAX) {
    issues.push({
      field: "amount",
      code: "INVALID_AMOUNT",
      message: "Introduce un importe mayor que 0 con hasta 2 decimales.",
    });
  }

  if (!isCurrencyCode(input.currency)) {
    issues.push({
      field: "currency",
      code: "INVALID_CURRENCY",
      message: "La moneda del movimiento no es válida.",
    });
  }

  const walletId =
    typeof input.walletId === "string" ? input.walletId.trim() : "";
  if (walletId.length === 0) {
    issues.push({
      field: "walletId",
      code: "WALLET_REQUIRED",
      message: "Selecciona una cartera.",
    });
  }

  if (!isTransactionCategoryId(input.categoryId)) {
    issues.push({
      field: "categoryId",
      code: "INVALID_CATEGORY",
      message: "Selecciona una categoría válida.",
    });
  } else if (
    isTransactionType(input.type) &&
    getTransactionCategory(input.categoryId).type !== input.type
  ) {
    issues.push({
      field: "categoryId",
      code: "CATEGORY_TYPE_MISMATCH",
      message: "La categoría no corresponde al tipo de movimiento.",
    });
  }

  const concept =
    typeof input.concept === "string" ? input.concept.trim() : "";
  if (concept.length === 0) {
    issues.push({
      field: "concept",
      code: "CONCEPT_REQUIRED",
      message: "El concepto es obligatorio.",
    });
  } else if (concept.length > TRANSACTION_CONCEPT_MAX_LENGTH) {
    issues.push({
      field: "concept",
      code: "CONCEPT_TOO_LONG",
      message: `El concepto no puede superar los ${TRANSACTION_CONCEPT_MAX_LENGTH} caracteres.`,
    });
  }

  const notes = typeof input.notes === "string" ? input.notes.trim() : "";
  if (notes.length > TRANSACTION_NOTES_MAX_LENGTH) {
    issues.push({
      field: "notes",
      code: "NOTES_TOO_LONG",
      message: `Las notas no pueden superar los ${TRANSACTION_NOTES_MAX_LENGTH} caracteres.`,
    });
  }

  const date = parseDateInput(input.date);
  if (!date) {
    issues.push({
      field: "date",
      code: "INVALID_DATE",
      message: "Introduce una fecha válida con formato DD/MM/AAAA.",
    });
  }

  if (issues.length > 0) {
    return { ok: false, error: issues };
  }

  return {
    ok: true,
    value: {
      type: input.type as TransactionType,
      amount: amount ?? 0,
      currency: input.currency as CreateTransactionDto["currency"],
      walletId,
      categoryId: input.categoryId,
      concept,
      ...(notes.length > 0 ? { notes } : {}),
      date: date ?? "",
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
