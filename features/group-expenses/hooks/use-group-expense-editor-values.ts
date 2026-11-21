import { useMemo } from "react";

import type { CurrencyCode } from "@/shared/constants/currencies";
import { getTodayIsoDate } from "@/shared/utils/date";

import type { GroupExpense } from "../types/group-expense.types";
import type { GroupExpenseFormValues } from "../utils/group-expense-form";
import { getGroupExpenseInitialValues } from "../utils/group-expense-form-load";

export interface UseGroupExpenseEditorValuesOptions {
  editingExpense: GroupExpense | null;
  viewerUid: string | undefined;
  groupId: string;
  memberIds: readonly string[];
  /** Group default currency of a create. */
  groupCurrency: CurrencyCode;
}

export interface GroupExpenseEditorValues {
  initialValues: GroupExpenseFormValues;
  /** Changes with the group and its members, so the page sheet remounts. */
  formKey: string;
}

/** Values of the create/edit form, rebuilt whenever the group changes. */
export function useGroupExpenseEditorValues({
  editingExpense,
  viewerUid,
  groupId,
  memberIds,
  groupCurrency,
}: UseGroupExpenseEditorValuesOptions): GroupExpenseEditorValues {
  const initialValues = useMemo(
    () =>
      getGroupExpenseInitialValues({
        editingExpense,
        viewerUid: viewerUid ?? "",
        groupId,
        memberIds,
        groupCurrency,
        today: getTodayIsoDate(),
      }),
    [editingExpense, groupCurrency, groupId, memberIds, viewerUid],
  );

  return {
    initialValues,
    formKey: `${editingExpense?.id ?? "new"}:${groupId}:${memberIds.join(",")}`,
  };
}
