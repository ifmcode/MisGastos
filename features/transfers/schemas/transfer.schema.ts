import { isCurrencyCode } from "@/shared/constants/currencies";
import { Result } from "@/shared/types/common.types";

import { parseAmountInput } from "@/features/wallets/schemas/wallet.schema";
import { parseDateInput } from "@/features/transactions/utils/transaction-date";

import { CreateTransferDto } from "../types/transfer.types";

export const TRANSFER_NOTES_MAX_LENGTH = 300;

export type TransferFormField =
  | "ownerId"
  | "fromWalletId"
  | "toWalletId"
  | "amount"
  | "currency"
  | "notes"
  | "date";

export type TransferValidationCode =
  | "OWNER_REQUIRED"
  | "FROM_WALLET_REQUIRED"
  | "TO_WALLET_REQUIRED"
  | "SAME_WALLET"
  | "INVALID_AMOUNT"
  | "INVALID_CURRENCY"
  | "NOTES_TOO_LONG"
  | "INVALID_DATE";

export interface TransferValidationIssue {
  field: TransferFormField;
  code: TransferValidationCode;
  message: string;
}

export type TransferValidationErrors = Partial<
  Record<TransferFormField, string>
>;

/**
 * Input accepted by transfer validation. Values are strings because they come
 * from forms or Firestore and must be checked at runtime.
 */
export interface TransferInput {
  fromWalletId: string;
  toWalletId: string;
  amount: string | number;
  currency: string;
  notes?: string | null;
  date: string;
}

export function validateTransferInput(
  input: TransferInput,
): Result<CreateTransferDto, TransferValidationIssue[]> {
  const issues: TransferValidationIssue[] = [];

  const fromWalletId =
    typeof input.fromWalletId === "string" ? input.fromWalletId.trim() : "";
  if (fromWalletId.length === 0) {
    issues.push({
      field: "fromWalletId",
      code: "FROM_WALLET_REQUIRED",
      message: "Selecciona la cartera de origen.",
    });
  }

  const toWalletId =
    typeof input.toWalletId === "string" ? input.toWalletId.trim() : "";
  if (toWalletId.length === 0) {
    issues.push({
      field: "toWalletId",
      code: "TO_WALLET_REQUIRED",
      message: "Selecciona la cartera de destino.",
    });
  }

  if (
    fromWalletId.length > 0 &&
    toWalletId.length > 0 &&
    fromWalletId === toWalletId
  ) {
    issues.push({
      field: "toWalletId",
      code: "SAME_WALLET",
      message: "La cartera de origen y destino deben ser distintas.",
    });
  }

  const amount = parseAmountInput(input.amount);
  if (amount === null || amount <= 0) {
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
      message: "La moneda de la transferencia no es válida.",
    });
  }

  const notes = typeof input.notes === "string" ? input.notes.trim() : "";
  if (notes.length > TRANSFER_NOTES_MAX_LENGTH) {
    issues.push({
      field: "notes",
      code: "NOTES_TOO_LONG",
      message: `Las notas no pueden superar los ${TRANSFER_NOTES_MAX_LENGTH} caracteres.`,
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
      fromWalletId,
      toWalletId,
      amount: amount ?? 0,
      currency: input.currency as CreateTransferDto["currency"],
      ...(notes.length > 0 ? { notes } : {}),
      date: date ?? "",
    },
  };
}

export function toTransferFieldErrors(
  issues: readonly TransferValidationIssue[],
): TransferValidationErrors {
  return issues.reduce<TransferValidationErrors>((errors, issue) => {
    if (!errors[issue.field]) {
      errors[issue.field] = issue.message;
    }
    return errors;
  }, {});
}
