/**
 * Atomic pair "group expense + linked personal movement" (TICKET-069). The
 * three operations live in their own files to respect the file-size rule; this
 * module is the public entry point of the repository seam.
 */
export { createGroupExpenseLinkOperation } from "./group-expense-create-link.operation";
export {
  softDeleteGroupExpenseLinkOperation,
  type SoftDeleteGroupExpenseLinkOptions,
} from "./group-expense-delete-link.operation";
export {
  updateGroupExpenseLinkOperation,
  type UpdateGroupExpenseLinkOptions,
} from "./group-expense-update-link.operation";
