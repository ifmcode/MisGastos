import type { Friend } from "@/features/friends/types/friend.types";
import { centsToAmount } from "@/features/friends/utils/friend-balance";
import type { CurrencyCode } from "@/shared/constants/currencies";
import type { Translate } from "@/shared/i18n/translate";
import type { DetailField, DetailSummary } from "@/shared/types/detail.types";

import type {
  ExpenseSplitMode,
  SharedExpense,
  SharedExpenseParticipant,
} from "../types/shared-expense.types";
import type { SharedExpenseDetailContext } from "./shared-expense-detail.types";
import { getSharedExpenseParticipantName } from "./shared-expense-friends";
import { formatBpsText } from "./shared-expense-split-text";

const SPLIT_MODE_KEYS: Record<ExpenseSplitMode, string> = {
  equal: "detail.split.equal",
  percentage: "detail.split.percentage",
  fixed: "detail.split.fixed",
  shares: "detail.split.shares",
};

/** Resolves the route id against the viewer-scoped list; blank ids never match. */
export function findSharedExpenseForDetail(
  expenses: readonly SharedExpense[],
  expenseId: string,
): SharedExpense | null {
  const id = expenseId.trim();
  if (id.length === 0) return null;

  return expenses.find((expense) => expense.id === id) ?? null;
}

/** Name of whoever paid: the viewer, or the friend with a safe fallback. */
export function getSharedExpensePayerLabel(
  expense: SharedExpense,
  friends: readonly Friend[],
  viewerUid: string,
  t: Translate,
): string {
  if (expense.payerId === viewerUid) return t("viewerName");

  return getSharedExpenseParticipantName(
    friends,
    expense.payerId,
    t("friendFallback"),
  );
}

export function getSharedExpenseSplitModeLabel(
  mode: ExpenseSplitMode,
  t: Translate,
): string {
  return t(SPLIT_MODE_KEYS[mode]);
}

/** Share amount plus the raw percentage or weight the mode stored. */
function getParticipantShareValue(
  participant: SharedExpenseParticipant,
  expense: SharedExpense,
  context: SharedExpenseDetailContext,
): string {
  const amount = context.formatCurrency(
    centsToAmount(participant.shareCents),
    expense.currency,
  );

  if (participant.percentageBps !== undefined) {
    return context.t("detail.participantSharePercent", {
      amount,
      percent: formatBpsText(participant.percentageBps),
    });
  }

  if (participant.weight !== undefined) {
    return context.t("detail.participantShareWeight", {
      amount,
      count: participant.weight,
    });
  }

  return amount;
}

/**
 * One row per participant, the viewer first and then the stored order. Legacy
 * percentage/shares rows keep rendering their stored value, zero included.
 */
export function getSharedExpenseParticipantFields(
  expense: SharedExpense,
  context: SharedExpenseDetailContext,
): DetailField[] {
  const isViewer = (participant: SharedExpenseParticipant) =>
    participant.userId === context.viewerUid;
  const ordered = [
    ...expense.participants.filter(isViewer),
    ...expense.participants.filter((participant) => !isViewer(participant)),
  ];

  return ordered.map((participant) => ({
    key: participant.userId,
    label: isViewer(participant)
      ? context.t("viewerName")
      : getSharedExpenseParticipantName(
          context.friends,
          participant.userId,
          context.t("friendFallback"),
        ),
    value: getParticipantShareValue(participant, expense, context),
  }));
}

export function getSharedExpenseDetailSummary(
  expense: SharedExpense,
  formatCurrency: (value: number, currency: CurrencyCode) => string,
  t: Translate,
): DetailSummary {
  return {
    label: t("detail.summaryLabel"),
    amount: formatCurrency(centsToAmount(expense.amountCents), expense.currency),
    meta: expense.currency,
    tone: "neutral",
  };
}
