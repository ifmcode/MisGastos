import { isCurrencyCode } from "@/shared/constants/currencies";
import { parseAmountInput } from "@/features/wallets/schemas/wallet-amount";

import { parseDateInput } from "../utils/transaction-date";
import {
  getTransactionCategory,
  isTransactionCategoryId,
  isTransactionType,
} from "../utils/transaction-options";
import {
  TRANSACTION_AMOUNT_MAX,
  TRANSACTION_CONCEPT_MAX_LENGTH,
  TRANSACTION_NOTES_MAX_LENGTH,
  TransactionInput,
  TransactionValidationIssue,
} from "./transaction-validation.types";

function getTypeIssue(
  input: TransactionInput,
): TransactionValidationIssue | null {
  if (isTransactionType(input.type)) return null;

  return {
    field: "type",
    code: "INVALID_TYPE",
    message: "Selecciona si es un gasto o un ingreso.",
  };
}

function getAmountIssue(
  input: TransactionInput,
): TransactionValidationIssue | null {
  const amount = parseAmountInput(input.amount);

  if (
    amount === null ||
    amount <= 0 ||
    amount > TRANSACTION_AMOUNT_MAX
  ) {
    return {
      field: "amount",
      code: "INVALID_AMOUNT",
      message: "Introduce un importe mayor que 0 con hasta 2 decimales.",
    };
  }

  return null;
}

function getCurrencyIssue(
  input: TransactionInput,
): TransactionValidationIssue | null {
  if (isCurrencyCode(input.currency)) return null;

  return {
    field: "currency",
    code: "INVALID_CURRENCY",
    message: "La moneda del movimiento no es válida.",
  };
}

function getWalletIssue(
  input: TransactionInput,
): TransactionValidationIssue | null {
  const walletId =
    typeof input.walletId === "string" ? input.walletId.trim() : "";

  if (walletId.length > 0) return null;

  return {
    field: "walletId",
    code: "WALLET_REQUIRED",
    message: "Selecciona una cartera.",
  };
}

function getCategoryIssue(
  input: TransactionInput,
): TransactionValidationIssue | null {
  if (!isTransactionCategoryId(input.categoryId)) {
    return {
      field: "categoryId",
      code: "INVALID_CATEGORY",
      message: "Selecciona una categoría válida.",
    };
  }

  if (
    isTransactionType(input.type) &&
    getTransactionCategory(input.categoryId).type !== input.type
  ) {
    return {
      field: "categoryId",
      code: "CATEGORY_TYPE_MISMATCH",
      message: "La categoría no corresponde al tipo de movimiento.",
    };
  }

  return null;
}

function getConceptIssue(
  input: TransactionInput,
): TransactionValidationIssue | null {
  const concept =
    typeof input.concept === "string" ? input.concept.trim() : "";

  if (concept.length === 0) {
    return {
      field: "concept",
      code: "CONCEPT_REQUIRED",
      message: "El concepto es obligatorio.",
    };
  }

  if (concept.length > TRANSACTION_CONCEPT_MAX_LENGTH) {
    return {
      field: "concept",
      code: "CONCEPT_TOO_LONG",
      message: `El concepto no puede superar los ${TRANSACTION_CONCEPT_MAX_LENGTH} caracteres.`,
    };
  }

  return null;
}

function getNotesIssue(
  input: TransactionInput,
): TransactionValidationIssue | null {
  const notes = typeof input.notes === "string" ? input.notes.trim() : "";

  if (notes.length <= TRANSACTION_NOTES_MAX_LENGTH) return null;

  return {
    field: "notes",
    code: "NOTES_TOO_LONG",
    message: `Las notas no pueden superar los ${TRANSACTION_NOTES_MAX_LENGTH} caracteres.`,
  };
}

function getDateIssue(
  input: TransactionInput,
): TransactionValidationIssue | null {
  if (parseDateInput(input.date)) return null;

  return {
    field: "date",
    code: "INVALID_DATE",
    message: "Introduce una fecha válida con formato DD/MM/AAAA.",
  };
}

/** Collects every field issue of a transaction input in display order. */
export function getTransactionIssues(
  input: TransactionInput,
): TransactionValidationIssue[] {
  return [
    getTypeIssue(input),
    getAmountIssue(input),
    getCurrencyIssue(input),
    getWalletIssue(input),
    getCategoryIssue(input),
    getConceptIssue(input),
    getNotesIssue(input),
    getDateIssue(input),
  ].filter(
    (issue): issue is TransactionValidationIssue => issue !== null,
  );
}
