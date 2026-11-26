import { deleteField } from "firebase/firestore";

import { isOrphanedWalletId } from "@/features/wallets/utils/deleted-wallet";
import { toIsoTimestamp } from "@/shared/utils/date";

import type { UpdateTransactionDto } from "../types/transaction.types";
import { toTransactionData } from "./transaction-firestore.utils";
import {
  readStoredDeletedAt,
  readStoredGroupExpenseId,
  readStoredGroupSettlementId,
  readStoredSharedExpenseId,
} from "./transaction-stored.utils";

/**
 * Document patch of a personal edit: the new payload plus the stored link ids.
 * A personal edit keeps the stored soft-delete stamp untouched (a deleted
 * movement is rejected before this runs).
 */
export function buildTransactionUpdatePatch(
  ownerId: string,
  stored: Record<string, unknown>,
  dto: UpdateTransactionDto,
  revision: number,
  now: string,
): Record<string, unknown> {
  const previousWalletId =
    typeof stored.walletId === "string" ? stored.walletId : "";

  const patch: Record<string, unknown> = {
    ...toTransactionData(ownerId, dto, now, revision),
    createdAt: toIsoTimestamp(stored.createdAt) ?? now,
    deletedAt: readStoredDeletedAt(stored),
  };

  const sharedExpenseId = readStoredSharedExpenseId(stored);
  if (sharedExpenseId) patch.sharedExpenseId = sharedExpenseId;

  const groupExpenseId = readStoredGroupExpenseId(stored);
  if (groupExpenseId) patch.groupExpenseId = groupExpenseId;

  const groupSettlementId = readStoredGroupSettlementId(stored);
  if (groupSettlementId) patch.groupSettlementId = groupSettlementId;

  if (
    !(
      previousWalletId === dto.walletId &&
      isOrphanedWalletId(previousWalletId)
    )
  ) {
    patch.walletName = deleteField();
  }

  return patch;
}
