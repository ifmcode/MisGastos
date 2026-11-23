import { GroupExpenseOperationError } from "./group-expense.errors";
import { assertGroupExpenseMember } from "./group-expense-guards";
import {
  assertGroupSettlementParticipant,
  requireGroupForSettlement,
  requireGroupSettlement,
} from "./group-settlement-guards";
import {
  buildGroupSettlementEvent,
  type GroupSettlementWriteDeps,
} from "./group-settlement-write-deps";

/**
 * Soft delete reverts the creditor income exactly once. When the viewer is the
 * debtor and the creditor already linked a movement, the delete is blocked: the
 * wallet belongs to the creditor, who must unlink it first from the edit route.
 * Repeated deletes are idempotent and write no second notification.
 */
export async function deleteGroupSettlementRecord(
  deps: GroupSettlementWriteDeps,
  viewerUid: string,
  settlementId: string,
): Promise<void> {
  const existing = await requireGroupSettlement(deps.repository, settlementId);
  assertGroupSettlementParticipant(existing, viewerUid);

  if (existing.deletedAt !== null) return;

  const group = await requireGroupForSettlement(
    deps.groupsRepository,
    existing.groupId,
  );
  assertGroupExpenseMember(group, viewerUid);

  if (
    existing.toUserId !== viewerUid &&
    existing.receiverTransactionId !== null
  ) {
    throw new GroupExpenseOperationError("SETTLEMENT_HAS_RECEIVER_MOVEMENT");
  }

  const now = new Date().toISOString();

  await deps.repository.softDeleteGroupSettlement(
    viewerUid,
    existing.id,
    now,
    buildGroupSettlementEvent({
      settlement: { ...existing, deletedAt: now, updatedAt: now },
      group,
      actorUid: viewerUid,
      event: "deleted",
      notifiedAt: now,
    }),
  );
}
