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
 * The transient form toggle decides the requirement; a caller that does not send
 * it keeps the previous contract and registers exactly when a wallet is present.
 */
function readRegistration(
  input: SharedExpenseInput,
  walletId: string | null,
): boolean {
  return typeof input.registerInWallet === "boolean"
    ? input.registerInWallet
    : walletId !== null;
}

/**
 * Reads the optional wallet/category link of the form. A viewer-paid expense
 * registers in a wallet only when the toggle says so: registration requires both
 * a wallet and its category, while no registration rejects any leftover id
 * (`LINK_WITHOUT_REGISTRATION`) and always clears the category. A friend-paid
 * one stays social-only; the service drops the wallet it may still send.
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
  const categoryId = readOptionalId(input.categoryId);
  const viewer = viewerUid.trim();
  const viewerPays = payerId !== null && payerId === viewer;
  const registration = readRegistration(input, walletId);

  if (viewerPays && !registration) {
    // The toggle says "No": a leftover id would create a movement the user
    // explicitly turned off, so the payload is rejected instead of guessed.
    if (walletId !== null || categoryId !== null) {
      issues.push({ field: "walletId", code: "LINK_WITHOUT_REGISTRATION" });
    }

    return { walletId: null, categoryId: null };
  }

  // No wallet means no personal movement, so the category cannot survive alone.
  const linkedCategoryId = walletId === null ? null : categoryId;

  // The category is a user decision: a linked movement is never saved with a
  // hidden default. A missing wallet already reports its own issue.
  if (viewerPays && registration) {
    if (walletId === null) {
      issues.push({ field: "walletId", code: "WALLET_REQUIRED" });
    } else if (categoryId === null) {
      issues.push({ field: "categoryId", code: "CATEGORY_REQUIRED" });
    }
  }

  return { walletId, categoryId: linkedCategoryId };
}
