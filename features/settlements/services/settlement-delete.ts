import { buildSettlementNotificationInput } from "../utils/settlement-notification";
import { SettlementOperationError } from "./settlement.errors";
import {
  assertSettlementParticipant,
  requireSettlement,
} from "./settlement-guards";
import { getSettlementRecipient } from "./settlement-persist";
import type { SettlementWriteDeps } from "./settlement-write-deps";

/**
 * Soft delete reverts the creditor income exactly once. When the viewer is the
 * debtor and the creditor already linked a movement, the delete is blocked: the
 * wallet belongs to the creditor, who must unlink it first from the detail.
 * Repeated deletes are idempotent and write no second notification.
 */
export async function deleteSettlementWithRepository(
  deps: SettlementWriteDeps,
  viewerUid: string,
  settlementId: string,
): Promise<void> {
  const existing = await requireSettlement(deps.repository, settlementId);
  assertSettlementParticipant(existing, viewerUid);

  if (existing.deletedAt !== null) return;

  if (existing.toUserId !== viewerUid && existing.receiverTransactionId !== null) {
    throw new SettlementOperationError("SETTLEMENT_HAS_RECEIVER_MOVEMENT");
  }

  const now = new Date().toISOString();
  const recipientUid = getSettlementRecipient(existing, viewerUid);

  await deps.repository.softDeleteSettlement(
    viewerUid,
    existing.id,
    now,
    buildSettlementNotificationInput({
      settlement: { ...existing, deletedAt: now, updatedAt: now },
      event: "deleted",
      recipientUid,
      actorUid: viewerUid,
      isFull: false,
      canLinkWallet: false,
    }),
  );
}
