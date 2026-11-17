import type { Friend } from "@/features/friends/types/friend.types";
import type { Wallet } from "@/features/wallets/types/wallet.types";
import type { CurrencyCode } from "@/shared/constants/currencies";
import { formatDateInput } from "@/shared/utils/date";

import type {
  ExpenseSplitMode,
  SharedExpense,
  SharedExpenseParticipant,
} from "../types/shared-expense.types";
import type {
  SharedExpenseFormValues,
  SplitValueTexts,
} from "./shared-expense-form";
import {
  createSharedExpenseFormValues,
  emptySplitValues,
} from "./shared-expense-form";
import { formatBpsText, formatCentsText } from "./shared-expense-split-text";

function participantText(
  participant: SharedExpenseParticipant,
  mode: ExpenseSplitMode,
): string {
  if (mode === "percentage") {
    return participant.percentageBps === undefined
      ? ""
      : formatBpsText(participant.percentageBps);
  }

  if (mode === "fixed") return formatCentsText(participant.shareCents);

  if (mode === "shares") {
    return participant.weight === undefined ? "" : String(participant.weight);
  }

  return "";
}

/** The friend of the pair: every stored expense keeps its immutable pair. */
export function resolveExpenseFriendUid(
  expense: SharedExpense,
  viewerUid: string,
): string {
  return expense.participantIds.find((id) => id !== viewerUid) ?? "";
}

/** Turns a stored expense into the raw text values the form edits. */
export function fromSharedExpense(
  expense: SharedExpense,
  viewerUid: string,
): SharedExpenseFormValues {
  const splitValues: Record<ExpenseSplitMode, SplitValueTexts> =
    emptySplitValues();
  splitValues[expense.splitMode] = Object.fromEntries(
    expense.participants.map((participant) => [
      participant.userId,
      participantText(participant, expense.splitMode),
    ]),
  );

  return {
    viewerUid,
    friendUid: resolveExpenseFriendUid(expense, viewerUid),
    description: expense.description,
    amount: formatCentsText(expense.amountCents),
    currency: expense.currency,
    date: expense.date,
    dateText: formatDateInput(expense.date),
    payerId: expense.payerId,
    splitMode: expense.splitMode,
    splitValues,
    walletId: expense.walletId ?? "",
    categoryId: expense.categoryId ?? "",
  };
}

export interface SharedExpenseInitialValuesOptions {
  editingExpense: SharedExpense | null;
  viewerUid: string;
  friends: readonly Friend[];
  lockedFriendUid?: string;
  /**
   * Create flows of a single friend prefill it; the movements menu passes
   * `false` so the friend field starts empty and stays required.
   */
  preselectFirstFriend?: boolean;
  preferredCurrency: CurrencyCode;
  today: string;
  wallets: readonly Wallet[];
  walletsLoading: boolean;
  walletsError: string | null;
}

/**
 * Initial form values of the create and edit flows. A stored wallet that no
 * longer exists (permanently deleted) is cleared, but never while the wallet
 * list is still loading or failed: that would drop a valid link silently.
 */
export function getSharedExpenseInitialValues({
  editingExpense,
  viewerUid,
  friends,
  lockedFriendUid,
  preselectFirstFriend = true,
  preferredCurrency,
  today,
  wallets,
  walletsLoading,
  walletsError,
}: SharedExpenseInitialValuesOptions): SharedExpenseFormValues {
  if (editingExpense) {
    const loaded = fromSharedExpense(editingExpense, viewerUid);
    const walletIsGone =
      loaded.walletId.length > 0 &&
      !walletsLoading &&
      walletsError === null &&
      !wallets.some((wallet) => wallet.id === loaded.walletId);

    return walletIsGone
      ? { ...loaded, walletId: "", categoryId: "" }
      : loaded;
  }

  const firstFriendUid = preselectFirstFriend ? friends[0]?.uid ?? "" : "";

  return createSharedExpenseFormValues({
    viewerUid,
    friendUid: lockedFriendUid ?? firstFriendUid,
    currency: preferredCurrency,
    date: today,
    payerId: viewerUid,
  });
}


