import type { Translate } from "@/shared/i18n/translate";
import type {
  DetailActionLabels,
  DetailDeleteConfirmation,
  DetailMissingStateLabels,
} from "@/shared/types/detail.types";

/** Header action copy of the group settlement detail. */
export function getGroupSettlementDetailActionLabels(
  tr: Translate,
  amount: string,
  pending: boolean,
): DetailActionLabels {
  return {
    close: tr("common:accessibility.back"),
    closeHint: tr("social:routeBackHint"),
    edit: tr("groupExpenses:settlementActions.editAccessibility", { amount }),
    editHint: tr("groupExpenses:settlementActions.editHint"),
    delete: tr("groupExpenses:settlementActions.deleteAccessibility", {
      amount,
    }),
    deleteHint: pending
      ? tr("groupExpenses:settlementActions.deletingHint")
      : tr("groupExpenses:settlementActions.deleteHint"),
  };
}

/** Safe state shown when the settlement no longer resolves for the viewer. */
export function getGroupSettlementDetailMissingLabels(
  tr: Translate,
): DetailMissingStateLabels {
  return {
    title: tr("groupExpenses:settlementDetail.missingTitle"),
    message: tr("groupExpenses:settlementDetail.missingMessage"),
    close: tr("groupExpenses:settlementDetail.missingAction"),
    closeAccessibilityLabel: tr(
      "groupExpenses:settlementDetail.missingActionAccessibility",
    ),
  };
}

/** Confirmation copy wired to the shared `ConfirmDialog` of the detail. */
export function getGroupSettlementDeleteConfirmation(
  tr: Translate,
  amount: string,
): DetailDeleteConfirmation {
  return {
    title: tr("groupExpenses:settlementDeleteDialog.title"),
    message: tr("groupExpenses:settlementDeleteDialog.message", { amount }),
  };
}
