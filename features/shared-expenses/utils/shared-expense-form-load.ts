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
  };
}
