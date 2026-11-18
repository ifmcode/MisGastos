import type { Translate } from "@/shared/i18n/translate";
import type {
  DetailActionLabels,
  DetailDeleteConfirmation,
  DetailMissingStateLabels,
} from "@/shared/types/detail.types";

/** Header action copy of the settlement detail, including the pending hint. */
export function getSettlementDetailActionLabels(
  t: Translate,
  { amount, pending }: { amount: string; pending: boolean },
): DetailActionLabels {
  return {
    close: t("common:accessibility.back"),
    closeHint: t("form.backHint"),
    edit: t("row.editAccessibility", { amount }),
    editHint: t("row.editHint"),
    delete: t("row.deleteAccessibility", { amount }),
    deleteHint: pending ? t("row.deletingHint") : t("row.deleteHint"),
  };
}

/** Safe state shown when the id no longer resolves in the viewer's list. */
export function getSettlementDetailMissingLabels(
  t: Translate,
): DetailMissingStateLabels {
  return {
    title: t("detail.missingTitle"),
    message: t("detail.missingMessage"),
    close: t("detail.missingAction"),
    closeAccessibilityLabel: t("detail.missingActionAccessibility"),
  };
}

export function getSettlementDeleteConfirmation(
  t: Translate,
  amount: string,
): DetailDeleteConfirmation {
  return {
    title: t("deleteDialog.title"),
    message: t("deleteDialog.message", { amount }),
  };
}
