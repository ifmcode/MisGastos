import type { ICategoryRepository } from "@/features/categories/repositories/category.repository";

import type {
  ISharedExpensesRepository,
  ISharedExpenseLinkRepository,
} from "../repositories/shared-expenses.repository";
import type {
  SharedExpense,
  ValidatedSharedExpense,
} from "../types/shared-expense.types";
import {
  ensureSharedExpenseCategory,
  getSharedExpenseCategoryId,
} from "./shared-expense-category";
import { SharedExpenseOperationError } from "./shared-expense.errors";
import {
  buildCreateSharedExpenseDto,
  buildUpdateSharedExpenseDto,
  isSharedExpenseLinked,
  resolveSharedExpenseLink,
  type ResolvedSharedExpenseLink,
} from "./shared-expense-persist";

export interface SharedExpenseWriteDeps {
  repository: ISharedExpensesRepository;
  linkRepository: ISharedExpenseLinkRepository;
  categoryRepository: ICategoryRepository;
}

/**
 * A selected wallet always gets a category, defaulting to the lazily created
 * "Gastos compartidos" one. Social-only expenses keep `categoryId` null.
 */
async function resolveCategoryId(
  deps: SharedExpenseWriteDeps,
  link: ResolvedSharedExpenseLink,
  viewerUid: string,
): Promise<string | null> {
  if (link.walletId === null) return null;

  // The form preselects the deterministic category id before the document
  // exists, so it must still go through the ensure step. A real user-chosen
  // category is kept untouched.
  if (
    link.categoryId !== null &&
    link.categoryId !== getSharedExpenseCategoryId(viewerUid)
  ) {
    return link.categoryId;
  }

  return ensureSharedExpenseCategory(deps.categoryRepository, viewerUid);
}

/** Routes to the atomic pair only when the payer linked one of their wallets. */
export async function createSharedExpenseRecord(
  deps: SharedExpenseWriteDeps,
  value: ValidatedSharedExpense,
  viewerUid: string,
  now: string,
): Promise<SharedExpense> {
  const link = resolveSharedExpenseLink(value, viewerUid);
  const categoryId = await resolveCategoryId(deps, link, viewerUid);
  const dto = buildCreateSharedExpenseDto(
    { ...value, ...link, categoryId },
    viewerUid,
    now,
  );

  return dto.walletId !== null
    ? deps.linkRepository.createExpenseLink(dto)
    : deps.repository.createExpense(dto);
}

/**
 * An expense that is already linked keeps the link path even after the wallet
 * is cleared, so the previous movement is reverted and soft-deleted.
 */
export async function updateSharedExpenseRecord(
  deps: SharedExpenseWriteDeps,
  existing: SharedExpense,
  value: ValidatedSharedExpense,
  viewerUid: string,
  now: string,
): Promise<SharedExpense> {
  const link = resolveSharedExpenseLink(value, viewerUid);
  const viewerPaysNow = link.walletId !== null;
  const viewerIsPayerNow = value.payerId === viewerUid;
  const viewerPaidBefore = existing.payerId === viewerUid;

  // The other participant's movement is owner-only: editing the social record
  // would leave that movement and its wallet with the old amount, and the rules
  // do not let this viewer repair it. The payer must make the change.
  if (isSharedExpenseLinked(existing) && !viewerPaidBefore) {
    throw new SharedExpenseOperationError("LINKED_MOVEMENT_FOREIGN");
  }

  if (!isSharedExpenseLinked(existing) && !viewerPaysNow) {
    return deps.repository.updateExpense(
      existing.id,
      buildUpdateSharedExpenseDto({ ...value, ...link }, now),
    );
  }

  const categoryId = await resolveCategoryId(deps, link, viewerUid);
  const dto = buildUpdateSharedExpenseDto({ ...value, ...link, categoryId }, now);

  return deps.linkRepository.updateExpenseLink(viewerUid, existing.id, dto);
}

/**
 * Linked expenses revert exactly once, but only the payer owns the movement.
 * A viewer who did not pay cannot write the other participant's wallet, so the
 * social record is deleted without touching that movement.
 */
export function deleteSharedExpenseRecord(
  deps: SharedExpenseWriteDeps,
  existing: SharedExpense,
  viewerUid: string,
  deletedAt: string,
): Promise<void> {
  if (!isSharedExpenseLinked(existing)) {
    return deps.repository.softDeleteExpense(existing.id, deletedAt);
  }

  if (existing.payerId !== viewerUid) {
    throw new SharedExpenseOperationError("LINKED_MOVEMENT_FOREIGN");
  }

  return deps.linkRepository.softDeleteExpenseLink(
    viewerUid,
    existing.id,
    deletedAt,
  );
}
