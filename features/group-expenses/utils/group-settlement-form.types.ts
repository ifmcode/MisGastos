import type { CurrencyCode } from "@/shared/constants/currencies";

import type { GroupDebt } from "../types/group-balance.types";
import type { GroupSettlement } from "../types/group-settlement.types";

/**
 * Direction of the pair from the viewer's point of view. The viewer is never
 * asked to choose it: the stored direct debt fixes who pays whom.
 */
export type GroupSettlementDirection = "viewer-pays" | "viewer-receives";

/** Raw form state of a group settlement; the amount stays as typed text. */
export interface GroupSettlementFormValues {
  viewerUid: string;
  groupId: string;
  currency: CurrencyCode;
  /** Debtor (payer) of the fixed pair. */
  fromUserId: string;
  /** Creditor (receiver) of the fixed pair. */
  toUserId: string;
  amount: string;
  /** ISO date (`YYYY-MM-DD`). */
  date: string;
  note: string;
  /** Creditor-owned wallet; empty keeps the settlement without a movement. */
  walletId: string;
  /** Income category; only used when a wallet is selected. */
  categoryId: string;
}

export interface GroupSettlementFormDefaults {
  viewerUid: string;
  groupId: string;
  /** Canonical debt of the pair; its direction wins over the route params. */
  debt: GroupDebt;
  today: string;
}

export interface GroupSettlementEditDefaults {
  settlement: GroupSettlement;
  viewerUid: string;
  today: string;
}
