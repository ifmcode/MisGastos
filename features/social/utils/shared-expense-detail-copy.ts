import type { Translate } from "@/shared/i18n/translate";
import type {
  DetailActionLabels,
  DetailDeleteConfirmation,
  DetailMissingStateLabels,
} from "@/shared/types/detail.types";

export interface SharedExpenseDetailActionCopyOptions {
  description: string;
  /** While the delete is in flight the trash hint explains what is happening. */
  pending: boolean;
}

/** Header action copy of the detail: back, edit and delete with their hints. */
export function getSharedExpenseDetailActionLabels(
  t: Translate,
  { description, pending }: SharedExpenseDetailActionCopyOptions,
): DetailActionLabels {
  return {
    close: t("common:accessibility.back"),
    closeHint: t("social:routeBackHint"),
    edit: t("sharedExpenses:row.editAccessibility", { description }),
    editHint: t("sharedExpenses:row.editHint"),
    delete: t("sharedExpenses:row.deleteAccessibility", { description }),
    deleteHint: pending
      ? t("sharedExpenses:row.deletingHint")
      : t("sharedExpenses:row.deleteHint"),
  };
}

/** Confirmation copy wired to the shared `ConfirmDialog` of the detail. */
export function getSharedExpenseDetailDeleteConfirmation(
  t: Translate,
  description: string,
): DetailDeleteConfirmation {
  return {
    title: t("sharedExpenses:deleteDialog.title"),
    message: t("sharedExpenses:deleteDialog.message", { description }),
  };
}

/** Safe state shown when the id no longer resolves in the viewer's list. */
export function getSharedExpenseDetailMissingLabels(
  t: Translate,
): DetailMissingStateLabels {
  return {
    title: t("sharedExpenses:detail.missingTitle"),
    message: t("sharedExpenses:detail.missingMessage"),
    close: t("sharedExpenses:detail.missingAction"),
    closeAccessibilityLabel: t(
      "sharedExpenses:detail.missingActionAccessibility",
    ),
  };
}
