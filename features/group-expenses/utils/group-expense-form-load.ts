import {
  emptySplitValues,
  type SplitValueTexts,
} from "@/features/shared-expenses/utils/shared-expense-form";
import {
  formatBpsText,
  formatCentsText,
} from "@/features/shared-expenses/utils/shared-expense-split-text";
import type { Wallet } from "@/features/wallets/types/wallet.types";
import type { CurrencyCode } from "@/shared/constants/currencies";
import { formatDateInput } from "@/shared/utils/date";

import { isGroupExpenseLinked } from "../services/group-expense-persist";
import type {
  ExpenseSplitMode,
  GroupExpense,
} from "../types/group-expense.types";
import {
  createGroupExpenseFormValues,
  type GroupExpenseFormValues,
} from "./group-expense-form";
import { resolveGroupExpensePayer } from "./group-expense-participants";

export interface GroupExpenseInitialValuesOptions {
  editingExpense: GroupExpense | null;
  viewerUid: string;
  /** Group chosen in the picker; ignored when editing (the expense owns it). */
  groupId: string;
  memberIds: readonly string[];
  /** Group default currency of a new expense. */
  groupCurrency: CurrencyCode;
  /** ISO date of a new expense. */
  today: string;
  wallets: readonly Wallet[];
  walletsLoading: boolean;
  walletsError: string | null;
  /**
   * Stored preference of the account for new expenses. An edited expense keeps
   * the state its own link implies, so the option is ignored on edit.
   */
  defaultRegisterInWallet: boolean;
}

/**
 * Stored shares seed every split mode, so editing an expense and switching mode
 * keeps meaningful values instead of starting from zero. `equal` needs no rows.
 */
function buildSplitValues(
  expense: GroupExpense,
): Record<ExpenseSplitMode, SplitValueTexts> {
  const values = emptySplitValues();

  for (const participant of expense.participants) {
    values.fixed[participant.userId] = formatCentsText(participant.shareCents);
    if (participant.percentageBps !== undefined) {
      values.percentage[participant.userId] = formatBpsText(
        participant.percentageBps,
      );
    }
    if (participant.weight !== undefined) {
      values.shares[participant.userId] = String(participant.weight);
    }
  }

  return values;
}

/** Link fields of a stored expense, with a permanently deleted wallet cleared. */
function readStoredLink(
  expense: GroupExpense,
  wallets: readonly Wallet[],
  walletsLoading: boolean,
  walletsError: string | null,
): Pick<GroupExpenseFormValues, "walletId" | "categoryId" | "registerInWallet"> {
  const walletId = (expense.walletId ?? "").trim();
  // Never drop a valid link while the wallet list is still loading or failed:
  // that would turn a linked expense into a social-only one silently.
  const walletIsGone =
    walletId.length > 0 &&
    !walletsLoading &&
    walletsError === null &&
    !wallets.some((wallet) => wallet.id === walletId);
  const resolvedWalletId = walletIsGone ? "" : walletId;

  return {
    walletId: resolvedWalletId,
    // A category never survives without a wallet: it would stay as a stale chip
    // while the movement has no wallet.
    categoryId:
      resolvedWalletId.length > 0 ? (expense.categoryId ?? "").trim() : "",
    // The toggle is derived from the stored link, never from a per-expense
    // boolean: a wallet or a movement means "Yes", social-only means "No".
    registerInWallet: isGroupExpenseLinked(expense),
  };
}

/** Values of the create/edit page sheet, rebuilt whenever the group changes. */
export function getGroupExpenseInitialValues({
  editingExpense,
  viewerUid,
  groupId,
  memberIds,
  groupCurrency,
  today,
  wallets,
  walletsLoading,
  walletsError,
  defaultRegisterInWallet,
}: GroupExpenseInitialValuesOptions): GroupExpenseFormValues {
  if (!editingExpense) {
    return createGroupExpenseFormValues({
      viewerUid,
      groupId,
      memberIds,
      currency: groupCurrency,
      date: today,
      registerInWallet: defaultRegisterInWallet,
    });
  }

  const base = createGroupExpenseFormValues({
    viewerUid,
    groupId: editingExpense.groupId,
    memberIds,
    currency: editingExpense.currency,
    date: editingExpense.date,
  });

  return {
    ...base,
    ...readStoredLink(editingExpense, wallets, walletsLoading, walletsError),
    description: editingExpense.description,
    amount: formatCentsText(editingExpense.amountCents),
    dateText: formatDateInput(editingExpense.date),
    payerId: resolveGroupExpensePayer(
      editingExpense.payerId,
      base.memberIds,
      viewerUid,
    ),
    participantIds: editingExpense.participants
      .map((participant) => participant.userId)
      .filter((userId) => base.memberIds.includes(userId)),
    splitMode: editingExpense.splitMode,
    splitValues: buildSplitValues(editingExpense),
  };
}
