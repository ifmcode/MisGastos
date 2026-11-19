import { formatDateInput } from "@/shared/utils/date";

import { getSharedExpenseCategoryId } from "../services/shared-expense-category";
import { isSharedExpenseLinked } from "../services/shared-expense-persist";
import type {
  ExpenseSplitMode,
  SharedExpense,
  SharedExpenseParticipant,
} from "../types/shared-expense.types";
import type {
  SharedExpenseFormValues,
  SplitValueTexts,
} from "./shared-expense-form";
import { emptySplitValues } from "./shared-expense-form";
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

  const walletId = (expense.walletId ?? "").trim();
  const sharedCategoryId =
    viewerUid.trim().length > 0 ? getSharedExpenseCategoryId(viewerUid) : "";
  const storedCategoryId = expense.categoryId ?? "";

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
    walletId,
    // A category never survives without a wallet: it would stay in the form as
    // a stale chip while the movement has no wallet. The deterministic shared
    // category is cleared for the same reason: the picker no longer offers it.
    categoryId:
      walletId.length > 0 && storedCategoryId !== sharedCategoryId
        ? storedCategoryId
        : "",
    // The toggle is derived from the stored link, never from a per-expense
    // boolean: a wallet or a movement means "Yes", legacy social-only "No".
    registerInWallet: isSharedExpenseLinked(expense),
  };
}
