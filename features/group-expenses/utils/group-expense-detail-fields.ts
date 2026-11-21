import type { DetailField } from "@/shared/types/detail.types";

import type { GroupExpense } from "../types/group-expense.types";
import type { GroupExpenseDetailContext } from "./group-expense-detail.types";
import {
  getGroupExpensePayerLabel,
  getGroupExpenseSplitModeLabel,
} from "./group-expense-detail";

/**
 * Read-only rows of the detail: the group, who paid, the split, the date and how
 * many participants carry a share. The amount lives in the summary card.
 */
export function buildGroupExpenseDetailFields(
  expense: GroupExpense,
  groupName: string,
  context: GroupExpenseDetailContext,
): DetailField[] {
  const { t } = context;

  return [
    { key: "group", label: t("detail.group"), value: groupName },
    {
      key: "payer",
      label: t("detail.payer"),
      value: getGroupExpensePayerLabel(
        expense,
        context.members,
        context.viewerUid,
        t,
      ),
    },
    {
      key: "splitMode",
      label: t("detail.splitMode"),
      value: getGroupExpenseSplitModeLabel(expense.splitMode, t),
    },
    {
      key: "date",
      label: t("detail.date"),
      value: context.formatDate(expense.date),
    },
    {
      key: "participants",
      label: t("detail.participants"),
      value: t("detail.participantsCount", {
        count: expense.participants.length,
      }),
    },
  ];
}
