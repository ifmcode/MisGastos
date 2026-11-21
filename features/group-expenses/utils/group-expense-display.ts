import type { Translate } from "@/shared/i18n/translate";

import type { GroupExpense } from "../types/group-expense.types";
import { getGroupExpenseViewerShare } from "./group-expense-ledger";

/**
 * `made-payment` means the viewer paid the whole expense; `charged` means the
 * viewer owes their share; `none` means the viewer is out of the split.
 */
export type GroupExpenseRowEffect = "made-payment" | "charged" | "none";

export interface GroupExpenseRowCopyOptions {
  viewerUid: string;
  /** Name of the payer, already resolved against the group members. */
  payerName: string;
  t: Translate;
}

export interface GroupExpenseRowCopy {
  payerLabel: string;
  effect: GroupExpenseRowEffect;
  /** Cents the viewer owes, 0 when the payer or not charged. */
  shareCents: number;
}

/**
 * Copy of one list row: who paid and how the expense affects the viewer. The
 * viewer's own payment is stated in the meta line, so the right-hand effect is
 * reserved for the share the viewer still owes.
 */
export function getGroupExpenseRowCopy(
  expense: GroupExpense,
  { viewerUid, payerName, t }: GroupExpenseRowCopyOptions,
): GroupExpenseRowCopy {
  const viewer = typeof viewerUid === "string" ? viewerUid.trim() : "";
  const isPayer = viewer.length > 0 && expense.payerId === viewer;
  const shareCents = getGroupExpenseViewerShare(expense, viewer);

  return {
    payerLabel: isPayer
      ? t("row.youPaid")
      : t("row.memberPaid", { name: payerName }),
    effect: isPayer ? "made-payment" : shareCents > 0 ? "charged" : "none",
    shareCents,
  };
}
