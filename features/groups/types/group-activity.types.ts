import type { CurrencyCode } from "@/shared/constants/currencies";

/** Every event the member-only group history can contain (TICKET-011). */
export type GroupActivityType =
  | "expense-created"
  | "expense-updated"
  | "expense-deleted"
  | "settlement-created"
  | "settlement-updated"
  | "settlement-deleted"
  | "member-joined"
  | "member-left"
  | "member-removed"
  | "owner-transferred"
  | "group-updated"
  | "simplify-debts-changed";

/** Mirrors the `isGroupActivityType` helper in `firestore.rules`. */
export const GROUP_ACTIVITY_TYPES: readonly GroupActivityType[] = [
  "expense-created",
  "expense-updated",
  "expense-deleted",
  "settlement-created",
  "settlement-updated",
  "settlement-deleted",
  "member-joined",
  "member-left",
  "member-removed",
  "owner-transferred",
  "group-updated",
  "simplify-debts-changed",
];

/** Fields a `group-updated` event may report. */
export type GroupActivityChangedField =
  | "name"
  | "description"
  | "defaultCurrency";

export const GROUP_ACTIVITY_CHANGED_FIELDS: readonly GroupActivityChangedField[] =
  ["name", "description", "defaultCurrency"];

/** One page of the feed: 20 events, clamped to 50 by the service. */
export const GROUP_ACTIVITY_PAGE_SIZE = 20;
export const GROUP_ACTIVITY_MAX_PAGE_SIZE = 50;

/** Bounded text mirrors the stored snapshot; descriptions cover a note. */
export const GROUP_ACTIVITY_NAME_MAX_LENGTH = 60;
export const GROUP_ACTIVITY_DESCRIPTION_MAX_LENGTH = 500;

/**
 * `groups/{groupId}/activity/{activityId}` document. Append-only and
 * member-only: it stores structured data only, never a sentence, so the UI
 * resolves the copy from the type and the payload.
 *
 * `targetName` is the affected member's display name snapshot, written only for
 * `member-removed`/`member-left`: the member leaves `memberIds`, so the UI can
 * no longer resolve it. `actorId` is always the caller that wrote the event.
 */
export interface GroupActivity {
  id: string;
  type: GroupActivityType;
  groupId: string;
  actorId: string;
  /** Affected member; `null` when the actor is the only subject. */
  targetUserId: string | null;
  /** Snapshot for membership removals; `null` everywhere else. */
  targetName: string | null;
  expenseId: string | null;
  settlementId: string | null;
  /**
   * Settlement pair: `fromUserId` (debtor) pays `toUserId` (creditor). Both are
   * `null` on every non-settlement event, so the feed can name who settled with
   * whom without resolving the settlement document.
   */
  fromUserId: string | null;
  toUserId: string | null;
  amountCents: number | null;
  currency: CurrencyCode | null;
  /** Expense concept or settlement note. */
  description: string | null;
  /** Empty unless `group-updated`. */
  changedFields: GroupActivityChangedField[];
  /** Only the **Simplificar deudas** setting event. */
  simplifyDebts: boolean | null;
  previousOwnerId: string | null;
  newOwnerId: string | null;
  createdAt: string;
}

/** Stored record before the mapper; every key is always present. */
export interface GroupActivityInput {
  type: GroupActivityType;
  groupId: string;
  actorId: string;
  createdAt: string;
  targetUserId?: string | null;
  targetName?: string | null;
  expenseId?: string | null;
  settlementId?: string | null;
  /** Settlement pair only; absent (→ `null`) on every other type. */
  fromUserId?: string | null;
  toUserId?: string | null;
  amountCents?: number | null;
  currency?: CurrencyCode | null;
  description?: string | null;
  changedFields?: readonly GroupActivityChangedField[];
  simplifyDebts?: boolean | null;
  previousOwnerId?: string | null;
  newOwnerId?: string | null;
}

/** Deterministic tiebreaker for entries that share a `createdAt`. */
export interface GroupActivityCursor {
  createdAt: string;
  id: string;
}

export interface GroupActivityQuery {
  limit?: number;
  after?: GroupActivityCursor | null;
}

export interface GroupActivityPage {
  items: GroupActivity[];
  hasMore: boolean;
  /**
   * Cursor of the last **raw** document of this page (not of the last mapped
   * event), so a dropped malformed row can never stall "load more". `null` on
   * the last page or when the row's cursor is unusable.
   */
  nextCursor: GroupActivityCursor | null;
}
