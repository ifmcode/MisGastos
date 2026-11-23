import type {
  CreateGroupExpenseDto,
  GroupExpense,
  UpdateGroupExpenseDto,
  ValidatedGroupExpense,
} from "../types/group-expense.types";
import { GroupExpenseOperationError } from "./group-expense.errors";

/** Wallet link the service persists: `null` keeps the expense social-only. */
export interface ResolvedGroupExpenseLink {
  walletId: string | null;
  categoryId: string | null;
}

/**
 * Defense in depth for the wallet toggle: the schema already reports the missing
 * wallet (`WALLET_REQUIRED`), the missing category (`CATEGORY_REQUIRED`) and a
 * link that contradicts "No" (`LINK_WITHOUT_REGISTRATION`), so only a caller
 * that bypasses the form validation reaches this guard. A wallet and a category
 * always travel together and a movement cannot outlive the wallet that backs
 * it. Wallet existence, ownership and currency stay inside the repository
 * transaction.
 */
export function assertGroupExpenseLinkCoherence(
  value: ValidatedGroupExpense,
  viewerUid: string,
): void {
  if (value.walletId === null) {
    if (value.categoryId !== null || value.linkedTransactionId !== null) {
      throw new GroupExpenseOperationError("LINK_WITHOUT_REGISTRATION");
    }

    return;
  }

  // Only the payer owns the personal movement, so the service drops the wallet
  // and the category of another member's value instead of persisting them.
  if (value.payerId !== viewerUid) return;

  if (value.categoryId === null) {
    throw new GroupExpenseOperationError("CATEGORY_REQUIRED");
  }
}

/**
 * Only the payer can own the linked movement (rules require it), so a wallet
 * selected while another member pays is dropped instead of persisted.
 */
export function resolveGroupExpenseLink(
  value: ValidatedGroupExpense,
  viewerUid: string,
): ResolvedGroupExpenseLink {
  const walletId =
    value.walletId !== null && value.payerId === viewerUid
      ? value.walletId
      : null;

  return walletId === null
    ? { walletId: null, categoryId: null }
    : { walletId, categoryId: value.categoryId };
}

/** A stored expense is linked when it has a wallet or a movement reference. */
export function isGroupExpenseLinked(expense: GroupExpense): boolean {
  return expense.walletId !== null || expense.linkedTransactionId !== null;
}

/** Full document of a new expense: `createdBy`/`createdAt` are immutable. */
export function buildCreateGroupExpenseDto(
  value: ValidatedGroupExpense,
  viewerUid: string,
  now: string,
): CreateGroupExpenseDto {
  return {
    groupId: value.groupId,
    payerId: value.payerId,
    amountCents: value.amountCents,
    currency: value.currency,
    splitMode: value.splitMode,
    participants: value.participants,
    description: value.description,
    date: value.date,
    walletId: value.walletId,
    categoryId: value.categoryId,
    linkedTransactionId: value.linkedTransactionId,
    createdBy: viewerUid,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

/** Only the mutable fields travel: the group and the creation stamp are fixed. */
export function buildUpdateGroupExpenseDto(
  value: ValidatedGroupExpense,
  now: string,
): UpdateGroupExpenseDto {
  return {
    payerId: value.payerId,
    amountCents: value.amountCents,
    currency: value.currency,
    splitMode: value.splitMode,
    participants: value.participants,
    description: value.description,
    date: value.date,
    walletId: value.walletId,
    categoryId: value.categoryId,
    updatedAt: now,
  };
}
