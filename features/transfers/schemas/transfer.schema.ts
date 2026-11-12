import { isCurrencyCode } from "@/shared/constants/currencies";
import { Result } from "@/shared/types/common.types";

import { parseAmountInput } from "@/features/wallets/schemas/wallet.schema";
import { parseDateInput } from "@/shared/utils/date";

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
  | "INSUFFICIENT_BALANCE"
  | "INVALID_CURRENCY"
  | "NOTES_TOO_LONG"
  | "INVALID_DATE";

export interface TransferValidationIssue {
  field: TransferFormField;
  code: TransferValidationCode;
}

export type TransferValidationErrors = Partial<
  Record<TransferFormField, TransferValidationCode>
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
    issues.push({ field: "fromWalletId", code: "FROM_WALLET_REQUIRED" });
  }

  const toWalletId =
    typeof input.toWalletId === "string" ? input.toWalletId.trim() : "";
  if (toWalletId.length === 0) {
    issues.push({ field: "toWalletId", code: "TO_WALLET_REQUIRED" });
  }

  if (
    fromWalletId.length > 0 &&
    toWalletId.length > 0 &&
    fromWalletId === toWalletId
  ) {
    issues.push({ field: "toWalletId", code: "SAME_WALLET" });
  }

  const amount = parseAmountInput(input.amount);
  if (amount === null || amount <= 0) {
    issues.push({ field: "amount", code: "INVALID_AMOUNT" });
  }

  if (!isCurrencyCode(input.currency)) {
    issues.push({ field: "currency", code: "INVALID_CURRENCY" });
  }

  const notes = typeof input.notes === "string" ? input.notes.trim() : "";
  if (notes.length > TRANSFER_NOTES_MAX_LENGTH) {
    issues.push({ field: "notes", code: "NOTES_TOO_LONG" });
  }

  const date = parseDateInput(input.date);
  if (!date) {
    issues.push({ field: "date", code: "INVALID_DATE" });
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
      errors[issue.field] = issue.code;
    }
    return errors;
  }, {});
}
