import { useMemo } from "react";

import type { GroupMember } from "@/features/groups/types/group.types";
import type { GroupExpense } from "@/features/group-expenses/types/group-expense.types";
import {
  getGroupExpenseDetailSummary,
  getGroupExpenseParticipantFields,
} from "@/features/group-expenses/utils/group-expense-detail";
import { buildGroupExpenseDetailFields } from "@/features/group-expenses/utils/group-expense-detail-fields";
import type {
  GroupExpenseDetailContext,
  GroupExpenseDetailLinkedMovement,
} from "@/features/group-expenses/utils/group-expense-detail.types";
import type { useAppLocale } from "@/shared/hooks/use-app-locale";
import type { Translate } from "@/shared/i18n/translate";
import type { DetailField, DetailSummary } from "@/shared/types/detail.types";

export interface GroupExpenseDetailView {
  summary: DetailSummary;
  fields: DetailField[];
  participants: DetailField[];
}

export interface UseGroupExpenseDetailViewOptions {
  expense: GroupExpense | null;
  groupName: string;
  viewerUid: string;
  members: readonly GroupMember[];
  linkedMovement: GroupExpenseDetailLinkedMovement | null;
  locale: ReturnType<typeof useAppLocale>;
  tr: Translate;
}

/**
 * Read-only rows of the group-expense detail, derived from the live record and
 * the loaded group. Returns null while the expense is missing.
 */
export function useGroupExpenseDetailView({
  expense,
  groupName,
  viewerUid,
  members,
  linkedMovement,
  locale,
  tr,
}: UseGroupExpenseDetailViewOptions): GroupExpenseDetailView | null {
  return useMemo(() => {
    if (!expense) return null;

    const context: GroupExpenseDetailContext = {
      viewerUid,
      members,
      formatCurrency: locale.formatCurrency,
      formatDate: locale.formatDate,
      t: tr,
      linkedMovement,
    };

    return {
      summary: getGroupExpenseDetailSummary(expense, locale.formatCurrency, tr),
      fields: buildGroupExpenseDetailFields(expense, groupName, context),
      participants: getGroupExpenseParticipantFields(expense, context),
    };
  }, [expense, groupName, linkedMovement, locale, members, tr, viewerUid]);
}
