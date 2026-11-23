import type {
  IGroupExpensesRepository,
  IGroupExpenseLinkRepository,
} from "../repositories/group-expenses.repository";
import type {
  GroupExpense,
  ValidatedGroupExpense,
} from "../types/group-expense.types";
import { GroupExpenseOperationError } from "./group-expense.errors";
import {
  assertGroupExpenseLinkCoherence,
  buildCreateGroupExpenseDto,
  buildUpdateGroupExpenseDto,
  isGroupExpenseLinked,
  resolveGroupExpenseLink,
  type ResolvedGroupExpenseLink,
} from "./group-expense-persist";

export interface GroupExpenseWriteDeps {
  repository: IGroupExpensesRepository;
  linkRepository: IGroupExpenseLinkRepository;
}

/**
 * A linked movement is saved with the category the viewer picked. Social-only
 * expenses keep `categoryId` null and never create a hidden default category.
 */
function resolveCategoryId(link: ResolvedGroupExpenseLink): string | null {
  if (link.walletId === null) return null;
  if (link.categoryId === null) {
    throw new GroupExpenseOperationError("CATEGORY_REQUIRED");
  }

  return link.categoryId;
}

/** Routes to the atomic pair only when the payer linked one of their wallets. */
export async function createGroupExpenseRecord(
  deps: GroupExpenseWriteDeps,
  value: ValidatedGroupExpense,
  viewerUid: string,
  now: string,
): Promise<GroupExpense> {
  assertGroupExpenseLinkCoherence(value, viewerUid);
  const link = resolveGroupExpenseLink(value, viewerUid);
  const categoryId = resolveCategoryId(link);
  const dto = buildCreateGroupExpenseDto(
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
 * is cleared or the currency changes, so the previous movement is reverted and
 * soft-deleted. Only the payer can write that movement: any other editor fails
 * with `LINKED_MOVEMENT_FOREIGN`.
 */
export async function updateGroupExpenseRecord(
  deps: GroupExpenseWriteDeps,
  existing: GroupExpense,
  value: ValidatedGroupExpense,
  viewerUid: string,
  now: string,
): Promise<GroupExpense> {
  assertGroupExpenseLinkCoherence(value, viewerUid);
  const link = resolveGroupExpenseLink(value, viewerUid);
  const viewerPaysNow = link.walletId !== null;
  const viewerPaidBefore = existing.payerId === viewerUid;

  if (isGroupExpenseLinked(existing) && !viewerPaidBefore) {
    throw new GroupExpenseOperationError("LINKED_MOVEMENT_FOREIGN");
  }

  if (!isGroupExpenseLinked(existing) && !viewerPaysNow) {
    return deps.repository.updateExpense(
      existing.id,
      buildUpdateGroupExpenseDto({ ...value, ...link }, now),
    );
  }

  const categoryId = resolveCategoryId(link);
  const dto = buildUpdateGroupExpenseDto({ ...value, ...link, categoryId }, now);

  return deps.linkRepository.updateExpenseLink(viewerUid, existing.id, dto);
}

/**
 * Linked expenses revert exactly once, but only the payer owns the movement.
 * Another editor cannot write that wallet, so the delete is rejected instead of
 * leaving the group record pointing at a movement it cannot revert.
 */
export async function deleteGroupExpenseRecord(
  deps: GroupExpenseWriteDeps,
  existing: GroupExpense,
  viewerUid: string,
  deletedAt: string,
): Promise<void> {
  if (!isGroupExpenseLinked(existing)) {
    return deps.repository.softDeleteExpense(existing.id, deletedAt);
  }

  if (existing.payerId !== viewerUid) {
    throw new GroupExpenseOperationError("LINKED_MOVEMENT_FOREIGN");
  }

  return deps.linkRepository.softDeleteExpenseLink(
    viewerUid,
    existing.id,
    deletedAt,
  );
}
