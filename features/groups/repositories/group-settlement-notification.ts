import type { CurrencyCode } from "@/shared/constants/currencies";
import type {
  GroupSettlementNotificationPayload,
  NotificationWrite,
} from "@/features/notifications/types/notification.types";

/** The three settlement events; the copy resolves them from `type`. */
export type GroupSettlementNotificationEvent = "created" | "updated" | "deleted";

/** Everything a `group-settlement` notification needs; ids and numbers only. */
export interface GroupSettlementNotificationInput {
  settlementId: string;
  groupId: string;
  groupName: string;
  /** The other member of the pair; every event notifies exactly that user. */
  recipientUid: string;
  /** The viewer who performed the event; `friendUid` of the payload. */
  actorUid: string;
  event: GroupSettlementNotificationEvent;
  amountCents: number;
  currency: CurrencyCode;
  /** Event stamp: `updatedAt` for create/edit, `deletedAt` for the delete. */
  notifiedAt: string;
}

/**
 * Group settlement event for the other member of the pair. The dedupe key joins
 * the settlement, the event and the event stamp, so a retried write is a no-op
 * while a real edit (new `updatedAt`) or the delete notifies once more.
 */
export function buildGroupSettlementNotification(
  input: GroupSettlementNotificationInput,
): NotificationWrite {
  const payload: GroupSettlementNotificationPayload = {
    settlementId: input.settlementId,
    groupId: input.groupId,
    groupName: input.groupName,
    friendUid: input.actorUid,
    amountCents: input.amountCents,
    currency: input.currency,
  };

  return {
    userId: input.recipientUid,
    type: "group-settlement",
    // A fresh object literal keeps the implicit index signature of the payload
    // map, so persistence can store it without casting.
    payload: { ...payload },
    dedupeKey: `group-settlement:${input.settlementId}:${input.event}:${input.notifiedAt}`,
    createdAt: input.notifiedAt,
  };
}
