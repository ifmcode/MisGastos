import { centsToAmount } from "@/features/friends/utils/friend-balance";
import type { GroupMember } from "@/features/groups/types/group.types";
import type { CurrencyCode } from "@/shared/constants/currencies";
import type { Translate } from "@/shared/i18n/translate";
import type { DetailField, DetailSummary } from "@/shared/types/detail.types";

import type {
  ExpenseSplitMode,
  GroupExpense,
  SharedExpenseParticipant,
} from "../types/group-expense.types";
import { formatBpsText } from "@/features/shared-expenses/utils/shared-expense-split-text";

import type { GroupExpenseDetailContext } from "./group-expense-detail.types";
import { getGroupMemberName } from "./group-expense-members";

const SPLIT_MODE_KEYS: Record<ExpenseSplitMode, string> = {
  equal: "detail.split.equal",
  percentage: "detail.split.percentage",
  fixed: "detail.split.fixed",
  shares: "detail.split.shares",
};

/** Resolves the route id against the viewer's loaded list; blank ids never match. */
export function findGroupExpenseForDetail(
  expenses: readonly GroupExpense[],
  expenseId: string,
): GroupExpense | null {
  const id = typeof expenseId === "string" ? expenseId.trim() : "";
  if (id.length === 0) return null;

  return expenses.find((expense) => expense.id === id) ?? null;
}

/** Name of whoever paid: the viewer, or the member with a safe fallback. */
export function getGroupExpensePayerLabel(
  expense: GroupExpense,
  members: readonly GroupMember[],
  viewerUid: string,
  t: Translate,
): string {
  if (expense.payerId === viewerUid.trim()) return t("viewerName");

  return getGroupMemberName(members, expense.payerId, {
    viewerUid,
    viewerLabel: t("viewerName"),
    fallback: t("memberFallback"),
  });
}

export function getGroupExpenseSplitModeLabel(
  mode: ExpenseSplitMode,
  t: Translate,
): string {
  return t(SPLIT_MODE_KEYS[mode]);
}

/** Share amount plus the raw percentage or weight the mode stored. */
function getParticipantShareValue(
  participant: SharedExpenseParticipant,
  expense: GroupExpense,
  context: GroupExpenseDetailContext,
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
 * One row per participant, the viewer first and then the stored order. The payer
 * is labelled so "paid for others" reads at a glance; stored percentages and
 * weights keep rendering, zero included.
 */
export function getGroupExpenseParticipantFields(
  expense: GroupExpense,
  context: GroupExpenseDetailContext,
): DetailField[] {
  const isViewer = (participant: SharedExpenseParticipant) =>
    participant.userId === context.viewerUid.trim();
  const ordered = [
    ...expense.participants.filter(isViewer),
    ...expense.participants.filter((participant) => !isViewer(participant)),
  ];
  const viewerUid = context.viewerUid.trim();

  return ordered.map((participant) => {
    const viewer = participant.userId === viewerUid;
    const name = viewer
      ? context.t("viewerName")
      : getGroupMemberName(context.members, participant.userId, {
          viewerUid,
          viewerLabel: context.t("viewerName"),
          fallback: context.t("memberFallback"),
        });

    return {
      key: participant.userId,
      label:
        participant.userId === expense.payerId
          ? context.t("detail.participantPayerLabel", { name })
          : name,
      value: getParticipantShareValue(participant, expense, context),
    };
  });
}

export function getGroupExpenseDetailSummary(
  expense: GroupExpense,
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
