import { useMemo } from "react";

import type { Friend } from "@/features/friends/types/friend.types";
import type { SharedExpense } from "@/features/shared-expenses/types/shared-expense.types";
import {
  getSharedExpenseDetailSummary,
  getSharedExpenseParticipantFields,
} from "@/features/shared-expenses/utils/shared-expense-detail";
import { buildSharedExpenseDetailFields } from "@/features/shared-expenses/utils/shared-expense-detail-fields";
import type {
  SharedExpenseDetailContext,
  SharedExpenseDetailLinkedMovement,
} from "@/features/shared-expenses/utils/shared-expense-detail.types";
import type { useAppLocale } from "@/shared/hooks/use-app-locale";
import type { Translate } from "@/shared/i18n/translate";
import type { DetailField } from "@/shared/types/detail.types";

export interface SharedExpenseDetailView {
  summary: ReturnType<typeof getSharedExpenseDetailSummary>;
  fields: DetailField[];
  participants: DetailField[];
}

export interface UseSharedExpenseDetailViewOptions {
  expense: SharedExpense | null;
  viewerUid: string;
  friends: readonly Friend[];
  linkedMovement: SharedExpenseDetailLinkedMovement | null;
  locale: ReturnType<typeof useAppLocale>;
  tr: Translate;
}

/**
 * Read-only detail of the shared expense, derived from the live record and the
 * resolved linked movement. Returns null while the expense is missing.
 */
export function useSharedExpenseDetailView({
  expense,
  viewerUid,
  friends,
  linkedMovement,
  locale,
  tr,
}: UseSharedExpenseDetailViewOptions): SharedExpenseDetailView | null {
  return useMemo(() => {
    if (!expense) return null;

    const context: SharedExpenseDetailContext = {
      viewerUid,
      friends,
      formatCurrency: locale.formatCurrency,
      formatDate: locale.formatDate,
      formatDateTime: locale.formatDateTime,
      t: tr,
      linkedMovement,
    };

    return {
      summary: getSharedExpenseDetailSummary(expense, locale.formatCurrency, tr),
      fields: buildSharedExpenseDetailFields(expense, context),
      participants: getSharedExpenseParticipantFields(expense, context),
    };
  }, [expense, friends, linkedMovement, locale, tr, viewerUid]);
}
