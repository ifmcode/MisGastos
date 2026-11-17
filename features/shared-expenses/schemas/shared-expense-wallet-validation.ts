import type { SharedExpenseInput } from "../types/shared-expense.types";
import type { SharedExpenseValidationIssue } from "./shared-expense-validation.types";

/** Wallet and category ids the form selected, already trimmed. */
export interface SharedExpenseLinkInput {
  walletId: string | null;
  categoryId: string | null;
}

/** Optional ids are trimmed; an empty string means "not selected". */
function readOptionalId(value: unknown): string | null {
  const id = typeof value === "string" ? value.trim() : "";

  return id.length > 0 ? id : null;
}

/**
 * Reads the optional wallet/category link of the form. The payer owns the linked
 * movement, so a viewer-paid expense must always carry a wallet and the category
 * it is saved with; a friend-paid one stays social-only and may omit both.
 * Ownership and currency of the wallet are checked by the service and the
 * repository, never here.
 */
export function readSharedExpenseLink(
  input: SharedExpenseInput,
  payerId: string | null,
  viewerUid: string,
  issues: SharedExpenseValidationIssue[],
): SharedExpenseLinkInput {
  const walletId = readOptionalId(input.walletId);
  const viewer = viewerUid.trim();

  if (payerId !== null && payerId === viewer && walletId === null) {
    issues.push({ field: "walletId", code: "WALLET_REQUIRED" });
  }

  // No wallet means no personal movement, so the category cannot survive alone.
  const categoryId =
    walletId === null ? null : readOptionalId(input.categoryId);

  // The category is a user decision: a linked movement is never saved with a
  // hidden default. A missing wallet already reports its own issue.
  if (
    payerId !== null &&
    payerId === viewer &&
    walletId !== null &&
    categoryId === null
  ) {
    issues.push({ field: "categoryId", code: "CATEGORY_REQUIRED" });
  }

  return { walletId, categoryId };
}
