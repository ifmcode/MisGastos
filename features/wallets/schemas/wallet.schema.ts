import { Result } from "@/shared/types/common.types";

import { CreateWalletDto } from "../types/wallet.types";
import { parseAmountInput } from "./wallet-amount";
import { getWalletIssues } from "./wallet-field-validation";
import {
  WALLET_DESCRIPTION_MAX_LENGTH,
  WALLET_NAME_MAX_LENGTH,
  WalletInput,
  WalletValidationErrors,
  WalletValidationIssue,
} from "./wallet-validation.types";

export {
  WALLET_DESCRIPTION_MAX_LENGTH,
  WALLET_MAX_AMOUNT,
  WALLET_NAME_MAX_LENGTH,
  type WalletFormField,
  type WalletInput,
  type WalletValidationCode,
  type WalletValidationErrors,
  type WalletValidationIssue,
} from "./wallet-validation.types";
export { parseAmountInput } from "./wallet-amount";

export function validateWalletInput(
  input: WalletInput,
): Result<CreateWalletDto, WalletValidationIssue[]> {
  const issues = getWalletIssues(input);

  if (issues.length > 0) {
    return { ok: false, error: issues };
  }

  const name = input.name.trim();
  const description =
    typeof input.description === "string" ? input.description.trim() : "";

  return {
    ok: true,
    value: {
      name,
      currency: input.currency,
      icon: input.icon,
      color: input.color.toUpperCase(),
      initialBalance: parseAmountInput(input.initialBalance) ?? 0,
      type: input.type,
      includeInTotal: input.includeInTotal,
      ...(description.length > 0 ? { description } : {}),
    } as CreateWalletDto,
  };
}

export function toWalletFieldErrors(
  issues: readonly WalletValidationIssue[],
): WalletValidationErrors {
  return issues.reduce<WalletValidationErrors>((errors, issue) => {
    if (!errors[issue.field]) {
      errors[issue.field] = issue.message;
    }
    return errors;
  }, {});
}
