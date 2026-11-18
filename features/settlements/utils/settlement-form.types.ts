import type { CurrencyCode } from "@/shared/constants/currencies";
import type { FriendBalance } from "@/features/friends/types/friend.types";

export type SettlementAmountMode = "total" | "partial";

/** Raw form state; the amount stays as typed text. */
export interface SettlementFormValues {
  viewerUid: string;
  friendUid: string;
  currency: CurrencyCode;
  mode: SettlementAmountMode;
  amount: string;
  /** ISO date (`YYYY-MM-DD`); empty while the user types an invalid date. */
  date: string;
  /** Same date as typed (`DD/MM/YYYY`). */
  dateText: string;
  note: string;
  /** Creditor-owned wallet; empty keeps the settlement without a movement. */
  walletId: string;
  /** Income category; only used when a wallet is selected. */
  categoryId: string;
}

export interface SettlementCurrencyOption {
  currency: CurrencyCode;
  /** Signed net: positive means the friend owes the viewer. */
  netBalanceCents: number;
  /** Always positive outstanding debt of that currency. */
  debtCents: number;
  direction: "viewer-owes-friend" | "friend-owes-viewer";
}

export interface SettlementFormDefaults {
  viewerUid: string;
  friendUid: string;
  balances: readonly FriendBalance[];
  today: string;
}
