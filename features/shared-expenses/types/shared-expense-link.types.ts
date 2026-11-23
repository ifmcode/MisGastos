/**
 * Copy namespace of the linked-movement molecules. The 1:1 shared expense and
 * the group expense render the same block with their own wording, so every
 * component reads its strings from the scope the form passes.
 */
export type SharedExpenseLinkScope = "sharedExpenses" | "groupExpenses";

/**
 * Wallet and category codes the link block translates. Both form schemas
 * satisfy it, so the block never imports a feature-specific error type.
 */
export interface SharedExpenseLinkFieldErrors {
  walletId?: string;
  categoryId?: string;
}
