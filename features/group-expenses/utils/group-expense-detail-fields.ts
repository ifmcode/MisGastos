import type { DetailField } from "@/shared/types/detail.types";

import { isGroupExpenseLinked } from "../services/group-expense-persist";
import type { GroupExpense } from "../types/group-expense.types";
import type { GroupExpenseDetailContext } from "./group-expense-detail.types";
import {
  getGroupExpensePayerLabel,
  getGroupExpenseSplitModeLabel,
} from "./group-expense-detail";

/**
 * Wallet and movement rows of a linked expense. Only the payer owns the mirror
 * movement, so a non-payer never sees the rows even when the record is linked.
 */
export function buildGroupExpenseLinkedMovementFields(
  expense: GroupExpense,
  context: GroupExpenseDetailContext,
): DetailField[] {
  if (expense.payerId !== context.viewerUid) return [];
  if (!isGroupExpenseLinked(expense)) return [];

  const linked = context.linkedMovement;
  if (!linked) return [];

  const { t } = context;
  const walletName = linked.walletName.trim();
  const movementLabel = linked.movementLabel?.trim() ?? "";

  return [
    {
      key: "wallet",
      label: t("detail.wallet"),
      value: walletName.length > 0 ? walletName : t("detail.walletUnavailable"),
    },
    {
      key: "linkedMovement",
      label: t("detail.linkedMovement"),
      value:
        movementLabel.length > 0
          ? movementLabel
          : t("detail.linkedMovementValue"),
    },
  ];
}

/**
 * Read-only rows of the detail: the group, who paid, the split, the date, how
 * many participants carry a share and, for the payer, the wallet link. The
 * amount lives in the summary card.
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
    ...buildGroupExpenseLinkedMovementFields(expense, context),
  ];
}
