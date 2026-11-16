/**
 * Atomic pair "shared expense + linked personal movement". The three operations
 * live in their own files to respect the file-size rule; this module is the
 * public entry point of the repository seam.
 */
export {
  createSharedExpenseLinkOperation,
} from "./shared-expense-create-link.operation";
export {
  softDeleteSharedExpenseLinkOperation,
  type SoftDeleteSharedExpenseLinkOptions,
} from "./shared-expense-delete-link.operation";
export {
  updateSharedExpenseLinkOperation,
  type UpdateSharedExpenseLinkOptions,
} from "./shared-expense-update-link.operation";
