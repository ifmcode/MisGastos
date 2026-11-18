import type {
  NotificationWrite,
  SettlementNotificationEvent,
  SettlementNotificationPayload,
} from "@/features/notifications/types/notification.types";

import type { Settlement } from "../types/settlement.types";

export interface SettlementNotificationInput {
  settlement: Settlement;
  event: SettlementNotificationEvent;
  /** The other participant; every event notifies exactly that user. */
  recipientUid: string;
  /** The viewer who performed the event. */
  actorUid: string;
  /** True when the settlement leaves the pair at zero in every currency. */
  isFull: boolean;
  /** True when the recipient is the creditor and no movement is linked yet. */
  canLinkWallet: boolean;
}

const UPDATED_EVENT = "updated";

/**
 * Deterministic notification id: a retried write resolves to the same document
 * and is skipped, while a real edit (new `updatedAt`) still notifies once.
 */
export function buildSettlementDedupeKey({
  settlementId,
  event,
  recipientUid,
  updatedAt,
}: {
  settlementId: string;
  event: SettlementNotificationEvent;
  recipientUid: string;
  updatedAt: string;
}): string {
  const base = `${settlementId}:${event}:${recipientUid}`;

  return event === UPDATED_EVENT ? `${base}:${updatedAt}` : base;
}

/**
 * Event notification of a settlement. The payload carries ids, cents and
 * booleans only; `friendUid` is the actor, so the recipient can resolve the
 * friend without another lookup.
 */
export function buildSettlementNotificationInput({
  settlement,
  event,
  recipientUid,
  actorUid,
  isFull,
  canLinkWallet,
}: SettlementNotificationInput): NotificationWrite {
  const payload: SettlementNotificationPayload = {
    settlementId: settlement.id,
    pairId: settlement.pairId,
    friendUid: actorUid,
    amountCents: settlement.amountCents,
    currency: settlement.currency,
    isFull,
    canLinkWallet,
  };

  return {
    userId: recipientUid,
    type: `settlement-${event}`,
    // A fresh object literal keeps the implicit index signature of the payload
    // map, so persistence can store it without casting.
    payload: { ...payload },
    dedupeKey: buildSettlementDedupeKey({
      settlementId: settlement.id,
      event,
      recipientUid,
      updatedAt: settlement.updatedAt,
    }),
    createdAt: settlement.updatedAt,
  };
}
