/** Inbox segments of TICKET-047: `seenAt == null` is Pendiente. */
export type NotificationSegment = "pending" | "viewed";

export interface NotificationSegmentCounts {
  pending: number;
  viewed: number;
}
