import { centsToAmount } from "@/features/friends/utils/friend-balance";
import type { DetailField } from "@/shared/types/detail.types";

import type { SharedExpense } from "../types/shared-expense.types";
import type { SharedExpenseDetailContext } from "./shared-expense-detail.types";
import {
  getSharedExpensePayerLabel,
  getSharedExpenseSplitModeLabel,
} from "./shared-expense-detail";
import { getSharedExpenseParticipantName } from "./shared-expense-friends";

/** Wallet and movement rows of a linked expense; empty for social-only ones. */
export function buildSharedExpenseLinkedMovementFields(
  context: SharedExpenseDetailContext,
): DetailField[] {
  const linked = context.linkedMovement;
  if (!linked) return [];

  const fields: DetailField[] = [
    {
      key: "wallet",
      label: context.t("detail.wallet"),
      value: linked.walletName,
    },
  ];
  const movementLabel = linked.movementLabel?.trim() ?? "";

  if (movementLabel.length > 0) {
    fields.push({
      key: "linkedMovement",
      label: context.t("detail.linkedMovement"),
      value: movementLabel,
    });
  }

  return fields;
}

/** Read-only rows of the detail, in the order the movement detail uses. */
export function buildSharedExpenseDetailFields(
  expense: SharedExpense,
  context: SharedExpenseDetailContext,
): DetailField[] {
  const { t } = context;
  const creator =
    expense.createdBy === context.viewerUid
      ? t("viewerName")
      : getSharedExpenseParticipantName(
          context.friends,
          expense.createdBy,
          t("friendFallback"),
        );

  return [
    {
      key: "description",
      label: t("detail.description"),
      value: expense.description,
    },
    {
      key: "total",
      label: t("detail.total"),
      value: context.formatCurrency(
        centsToAmount(expense.amountCents),
        expense.currency,
      ),
    },
    { key: "currency", label: t("detail.currency"), value: expense.currency },
    {
      key: "date",
      label: t("detail.date"),
      value: context.formatDate(expense.date),
    },
    {
      key: "payer",
      label: t("detail.payer"),
      value: getSharedExpensePayerLabel(
        expense,
        context.friends,
        context.viewerUid,
        t,
      ),
    },
    {
      key: "splitMode",
      label: t("detail.splitMode"),
      value: getSharedExpenseSplitModeLabel(expense.splitMode, t),
    },
    ...buildSharedExpenseLinkedMovementFields(context),
    { key: "creator", label: t("detail.creator"), value: creator },
    {
      key: "createdAt",
      label: t("detail.createdAt"),
      value: context.formatDateTime(expense.createdAt),
    },
    {
      key: "updatedAt",
      label: t("detail.updatedAt"),
      value: context.formatDateTime(expense.updatedAt),
    },
  ];
}
