import type { Translate } from "@/shared/i18n/translate";

import type {
  TransactionValidationCode,
  TransactionValidationErrors,
} from "../schemas/transaction-validation.types";

/**
 * Translated text of a transaction field error. The missing category has its
 * own field copy; every other code keeps the shared validation namespace.
 */
export function getTransactionFieldErrorText(
  code: TransactionValidationCode,
  t: Translate,
): string {
  if (code === "CATEGORY_REQUIRED") return t("form.selectCategoryRequired");

  return t(`validation:transactions.${code}`);
}

/**
 * First field error of the form, in the order the validator collected them.
 * It feeds the notice above the actions; each field keeps its inline message.
 */
export function getFirstTransactionFieldError(
  errors: TransactionValidationErrors,
): TransactionValidationCode | null {
  for (const code of Object.values(errors)) {
    if (code) return code;
  }

  return null;
}
