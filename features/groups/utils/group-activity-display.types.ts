import type { CurrencyCode } from "@/shared/constants/currencies";

import type {
  GroupActivityChangedField,
  GroupActivityType,
} from "../types/group-activity.types";
import type { GroupMember } from "../types/group.types";

/**
 * One history entry resolved for the UI. It never carries a sentence: the row
 * picks the copy from `type` and the viewer flags, so both languages share it.
 */
export interface GroupActivityDisplay {
  /** React key: the activity id, unique inside one group feed. */
  key: string;
  type: GroupActivityType;
  actorName: string | null;
  /** Affected member, resolved from the members or the stored snapshot. */
  targetName: string | null;
  /** Settlement pair: `fromName` paid `toName`; null on every other type. */
  fromName: string | null;
  toName: string | null;
  /** `member-joined` written by another member (owner accepting a request). */
  isMemberAddition: boolean;
  isViewerActor: boolean;
  isViewerTarget: boolean;
  amountCents: number | null;
  currency: CurrencyCode | null;
  description: string | null;
  changedFields: GroupActivityChangedField[];
  simplifyDebts: boolean | null;
  expenseId: string | null;
  settlementId: string | null;
  createdAt: string;
}

export interface GroupActivityDisplayOptions {
  members: readonly GroupMember[];
  viewerUid: string;
  /** Translated "you" label for the settlement pair. */
  viewerName: string;
  /** Translated fallback for a member that can no longer be resolved. */
  unknownMember: string;
}

/** Where a pressable activity row leads; membership and settings lead nowhere. */
export type GroupActivityDestination =
  | { kind: "expense"; expenseId: string }
  | { kind: "settlement"; settlementId: string };
