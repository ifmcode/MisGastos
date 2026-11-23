import type { CurrencyCode } from "@/shared/constants/currencies";
import {
  emptySplitValues,
  type SplitValueTexts,
} from "@/features/shared-expenses/utils/shared-expense-form";
import { formatDateInput } from "@/shared/utils/date";

import type {
  ExpenseSplitMode,
  GroupExpenseInput,
} from "../types/group-expense.types";
import {
  getGroupExpenseParticipantIds,
  readGroupExpenseIds,
  resolveGroupExpensePayer,
} from "./group-expense-participants";

/** Raw form state of a group expense; every amount stays as typed text. */
export interface GroupExpenseFormValues {
  viewerUid: string;
  groupId: string;
  /** Active members of the selected group; the payer and split are scoped to it. */
  memberIds: string[];
  description: string;
  amount: string;
  currency: CurrencyCode;
  /** ISO date (`YYYY-MM-DD`). */
  date: string;
  /** Display text derived from `date` (`DD/MM/YYYY`). */
  dateText: string;
  payerId: string;
  /** Selected participants only: the payer may be excluded and pay for others. */
  participantIds: string[];
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

export interface GroupExpenseFormDefaults {
  viewerUid: string;
  groupId: string;
  memberIds: readonly string[];
  currency: CurrencyCode;
  date: string;
  payerId?: string;
  /** Stored preference of new expenses; omitted means no wallet registration. */
  registerInWallet?: boolean;
}

export function createGroupExpenseFormValues(
  defaults: GroupExpenseFormDefaults,
): GroupExpenseFormValues {
  const memberIds = readGroupExpenseIds(defaults.memberIds);

  return {
    viewerUid: defaults.viewerUid,
    groupId: defaults.groupId,
    memberIds,
    description: "",
    amount: "",
    currency: defaults.currency,
    date: defaults.date,
    dateText: formatDateInput(defaults.date),
    payerId: resolveGroupExpensePayer(
      defaults.payerId ?? "",
      memberIds,
      defaults.viewerUid,
    ),
    participantIds: [...memberIds],
    splitMode: "equal",
    splitValues: emptySplitValues(),
    walletId: "",
    categoryId: "",
    registerInWallet: defaults.registerInWallet ?? false,
  };
}

/** Raw payload for the schema: only the selected participants carry a value. */
export function toGroupExpenseInput(
  values: GroupExpenseFormValues,
): GroupExpenseInput {
  const activeValues = values.splitValues[values.splitMode] ?? {};
  const registersInWallet = values.registerInWallet;
  const hasWallet = registersInWallet && values.walletId.trim().length > 0;

  return {
    groupId: values.groupId,
    description: values.description,
    amount: values.amount,
    currency: values.currency,
    date: values.date,
    payerId: values.payerId,
    splitMode: values.splitMode,
    participants: getGroupExpenseParticipantIds(values).map((userId) => ({
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
 * visible while the viewer is the payer and disappears when another member pays.
 */
export function isGroupExpenseWalletRegistrationVisible(
  payerId: string,
  viewerUid: string,
): boolean {
  const viewer = viewerUid.trim();
  const payer = payerId.trim();

  return viewer.length > 0 && payer === viewer;
}
