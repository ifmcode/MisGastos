import type { CurrencyCode } from "@/shared/constants/currencies";
import { formatDateInput } from "@/shared/utils/date";

import type {
  ExpenseSplitMode,
  SharedExpenseInput,
} from "../types/shared-expense.types";

export type SplitValueTexts = Record<string, string>;

/** Raw form state; every amount and split value stays as typed text. */
export interface SharedExpenseFormValues {
  viewerUid: string;
  friendUid: string;
  description: string;
  amount: string;
  currency: CurrencyCode;
  /** ISO date (`YYYY-MM-DD`); empty while the user types an invalid date. */
  date: string;
  /** Same date as typed (`DD/MM/YYYY`). */
  dateText: string;
  payerId: string;
  splitMode: ExpenseSplitMode;
  splitValues: Record<ExpenseSplitMode, SplitValueTexts>;
  /** Payer-owned wallet of the linked movement; empty keeps the expense social. */
  walletId: string;
  /** Expense category of the linked movement; empty leaves it to persistence. */
  categoryId: string;
  /**
   * Transient UI switch of the wallet registration; never persisted. The stored
   * wallet, category and linked movement are the single source of truth, so the
   * toggle is derived from them when an expense is loaded.
   */
  registerInWallet: boolean;
}

export interface SharedExpenseFormDefaults {
  viewerUid: string;
  friendUid: string;
  currency: CurrencyCode;
  date: string;
  payerId?: string;
  /** Stored preference of new expenses; omitted means no wallet registration. */
  registerInWallet?: boolean;
}

/** One empty value map per mode so switching never reads stale entries. */
export function emptySplitValues(): Record<ExpenseSplitMode, SplitValueTexts> {
  return { equal: {}, percentage: {}, fixed: {}, shares: {} };
}

export function createSharedExpenseFormValues(
  defaults: SharedExpenseFormDefaults,
): SharedExpenseFormValues {
  return {
    viewerUid: defaults.viewerUid,
    friendUid: defaults.friendUid,
    description: "",
    amount: "",
    currency: defaults.currency,
    date: defaults.date,
    dateText: formatDateInput(defaults.date),
    payerId: defaults.payerId ?? defaults.viewerUid,
    splitMode: "equal",
    splitValues: emptySplitValues(),
    walletId: "",
    categoryId: "",
    registerInWallet: defaults.registerInWallet ?? false,
  };
}

/** Viewer and friend, deduplicated: the only valid 1:1 participant pair. */
export function getSharedExpenseParticipantIds(
  values: SharedExpenseFormValues,
): string[] {
  const ids = [values.viewerUid, values.friendUid]
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  return ids.filter((id, index) => ids.indexOf(id) === index);
}

export function toSharedExpenseInput(
  values: SharedExpenseFormValues,
): SharedExpenseInput {
  const activeValues = values.splitValues[values.splitMode] ?? {};
  const registersInWallet = values.registerInWallet;
  const hasWallet = registersInWallet && values.walletId.trim().length > 0;

  return {
    friendUid: values.friendUid,
    description: values.description,
    amount: values.amount,
    currency: values.currency,
    date: values.date,
    payerId: values.payerId,
    splitMode: values.splitMode,
    participants: getSharedExpenseParticipantIds(values).map((userId) => ({
      userId,
      value: activeValues[userId] ?? "",
    })),
    // "No" clears both ids, so a stale selection can never reach the schema.
    walletId: registersInWallet ? values.walletId : "",
    // Without a wallet the persisted link has no category, whatever the local
    // state still holds.
    categoryId: hasWallet ? values.categoryId : "",
    registerInWallet: registersInWallet,
  };
}

/**
 * Only the payer can own the linked movement, so the registration toggle is
 * visible while the viewer is the payer and disappears when the friend pays.
 */
export function isSharedExpenseWalletRegistrationVisible(
  payerId: string,
  viewerUid: string,
): boolean {
  const viewer = viewerUid.trim();
  const payer = payerId.trim();

  return viewer.length > 0 && payer === viewer;
}

export function isPayerSelectable(
  payerId: string,
  participantIds: readonly string[],
): boolean {
  return participantIds.includes(payerId);
}

export function resolvePayerId(
  payerId: string,
  participantIds: readonly string[],
  fallbackId: string,
): string {
  return isPayerSelectable(payerId, participantIds) ? payerId : fallbackId;
}
