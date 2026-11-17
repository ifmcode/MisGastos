import type {
  ISharedExpensesRepository,
  ISharedExpenseLinkRepository,
} from "../repositories/shared-expenses.repository";
import type {
  SharedExpense,
  ValidatedSharedExpense,
} from "../types/shared-expense.types";
import { SharedExpenseOperationError } from "./shared-expense.errors";
import {
  assertSharedExpensePayerWallet,
  buildCreateSharedExpenseDto,
  buildUpdateSharedExpenseDto,
  isSharedExpenseLinked,
  resolveSharedExpenseLink,
  type ResolvedSharedExpenseLink,
} from "./shared-expense-persist";

export interface SharedExpenseWriteDeps {
  repository: ISharedExpensesRepository;
  linkRepository: ISharedExpenseLinkRepository;
}

/**
 * A linked movement is saved with the category the viewer picked. Social-only
 * expenses keep `categoryId` null and never create a hidden default category.
 */
function resolveCategoryId(link: ResolvedSharedExpenseLink): string | null {
  if (link.walletId === null) return null;
  if (link.categoryId === null) {
    throw new SharedExpenseOperationError("CATEGORY_REQUIRED");
  }

  return link.categoryId;
}

/** Routes to the atomic pair only when the payer linked one of their wallets. */
export async function createSharedExpenseRecord(
  deps: SharedExpenseWriteDeps,
  value: ValidatedSharedExpense,
  viewerUid: string,
  now: string,
): Promise<SharedExpense> {
  assertSharedExpensePayerWallet(value, viewerUid);
  const link = resolveSharedExpenseLink(value, viewerUid);
  const categoryId = resolveCategoryId(link);
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
  assertSharedExpensePayerWallet(value, viewerUid);
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

  const categoryId = resolveCategoryId(link);
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
