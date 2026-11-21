import type { Translate } from "@/shared/i18n/translate";
import type {
  DetailActionLabels,
  DetailDeleteConfirmation,
  DetailMissingStateLabels,
} from "@/shared/types/detail.types";

export interface GroupExpenseDetailActionCopyOptions {
  description: string;
  /** While the delete is in flight the trash hint explains what is happening. */
  pending: boolean;
}

/** Header action copy of the detail: back, edit and delete with their hints. */
export function getGroupExpenseDetailActionLabels(
  t: Translate,
  { description, pending }: GroupExpenseDetailActionCopyOptions,
): DetailActionLabels {
  return {
    close: t("common:accessibility.back"),
    closeHint: t("social:routeBackHint"),
    edit: t("groupExpenses:actions.editAccessibility", { description }),
    editHint: t("groupExpenses:actions.editHint"),
    delete: t("groupExpenses:actions.deleteAccessibility", { description }),
    deleteHint: pending
      ? t("groupExpenses:actions.deletingHint")
      : t("groupExpenses:actions.deleteHint"),
  };
}

/** Confirmation copy wired to the shared `ConfirmDialog` of the detail. */
export function getGroupExpenseDetailDeleteConfirmation(
  t: Translate,
  description: string,
): DetailDeleteConfirmation {
  return {
    title: t("groupExpenses:deleteDialog.title"),
    message: t("groupExpenses:deleteDialog.message", { description }),
  };
}

/** Safe state shown when the id no longer resolves for the viewer. */
export function getGroupExpenseDetailMissingLabels(
  t: Translate,
): DetailMissingStateLabels {
  return {
    title: t("groupExpenses:detail.missingTitle"),
    message: t("groupExpenses:detail.missingMessage"),
    close: t("groupExpenses:detail.missingAction"),
    closeAccessibilityLabel: t(
      "groupExpenses:detail.missingActionAccessibility",
    ),
  };
}
