import type { CurrencyCode } from "@/shared/constants/currencies";

/**
 * Net position of one member in one currency:
 * `sum(amountPaid) - sum(shareCents)`. Positive means the group owes the member;
 * negative means the member owes the group. The nets of one currency always add
 * up to zero because every expense credits the payer the exact amount it
 * distributes across the participants.
 */
export interface GroupMemberNetBalance {
  userId: string;
  netCents: number;
}

/** Per-currency nets, never converted nor summed across currencies. */
export interface GroupCurrencyBalances {
  currency: CurrencyCode;
  balances: GroupMemberNetBalance[];
}

/** `fromUserId` owes `toUserId` `amountCents` in `currency`. */
export interface GroupDebt {
  currency: CurrencyCode;
  fromUserId: string;
  toUserId: string;
  amountCents: number;
}

/**
 * Structural input of the balance engine for a recorded settlement: the payer
 * (`fromUserId`) already paid the receiver (`toUserId`), so it cancels debt
 * instead of creating it. TICKET-010 Phase A passes an empty list; Phase B's
 * `groups/{groupId}/settlements` mapper must satisfy this shape (the 1:1
 * `Settlement` already uses `fromUserId` = debtor and `toUserId` = creditor), so
 * the engine never depends on the settlement module. `deletedAt` is `null` for
 * an active record, consistent with group expenses.
 */
export interface GroupSettlementLedgerEntry {
  fromUserId: string;
  toUserId: string;
  amountCents: number;
  currency: CurrencyCode;
  deletedAt: string | null;
}

/**
 * Raw nets plus the suggested transfers. `currencies` is the same in both
 * toggle states; `debts` is the simplified suggestion when `simplifyDebts` is
 * `true` and the direct expense-level debts when it is `false`.
 */
export interface GroupBalances {
  currencies: GroupCurrencyBalances[];
  debts: GroupDebt[];
  simplifyDebts: boolean;
}

/** One group row of the social list; `balances` is empty when settled. */
export interface GroupBalanceSummary {
  groupId: string;
  balances: Array<{ currency: CurrencyCode; netCents: number }>;
}

/** The viewer's net in one currency: positive means the group owes them. */
export interface ViewerGroupBalance {
  currency: CurrencyCode;
  netCents: number;
}
