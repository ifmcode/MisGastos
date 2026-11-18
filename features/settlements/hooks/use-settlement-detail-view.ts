import { useMemo } from "react";

import type { useAppLocale } from "@/shared/hooks/use-app-locale";
import type { Translate } from "@/shared/i18n/translate";
import type {
  DetailActionLabels,
  DetailDeleteConfirmation,
  DetailField,
  DetailMissingStateLabels,
  DetailSummary,
} from "@/shared/types/detail.types";

import type { Settlement } from "../types/settlement.types";
import {
  getSettlementDeleteConfirmation,
  getSettlementDetailActionLabels,
  getSettlementDetailMissingLabels,
} from "../utils/settlement-detail-copy";
import {
  getSettlementDetailFields,
  getSettlementDetailSubtitle,
  getSettlementDetailSummary,
  type SettlementDetailContext,
} from "../utils/settlement-detail-view";

export interface SettlementDetailView {
  subtitle: string;
  summary: DetailSummary | undefined;
  fields: DetailField[];
  labels: DetailActionLabels;
  missingLabels: DetailMissingStateLabels;
  deleteConfirmation: DetailDeleteConfirmation | null;
}

export interface UseSettlementDetailViewOptions {
  settlement: Settlement | null;
  viewerUid: string;
  viewerName: string;
  friendName: string;
  walletName: string | null;
  walletArchived: boolean;
  /** Already formatted amount of the settlement. */
  amount: string;
  pending: boolean;
  locale: ReturnType<typeof useAppLocale>;
  tr: Translate;
}

/** Copy and read-only rows of the detail routes, derived from the live record. */
export function useSettlementDetailView({
  settlement,
  viewerUid,
  viewerName,
  friendName,
  walletName,
  walletArchived,
  amount,
  pending,
  locale,
  tr,
}: UseSettlementDetailViewOptions): SettlementDetailView {
  return useMemo(() => {
    const context: SettlementDetailContext = {
      viewerUid,
      viewerName: viewerName || viewerUid,
      friendName,
      walletName,
      walletArchived,
      formatCurrency: locale.formatCurrency,
      formatDate: locale.formatDate,
      formatDateTime: locale.formatDateTime,
      t: tr,
    };

    return {
      subtitle: settlement ? getSettlementDetailSubtitle(settlement, context) : "",
      summary: settlement
        ? getSettlementDetailSummary(settlement, context)
        : undefined,
      fields: settlement ? getSettlementDetailFields(settlement, context) : [],
      labels: getSettlementDetailActionLabels(tr, { amount, pending }),
      missingLabels: getSettlementDetailMissingLabels(tr),
      deleteConfirmation: settlement
        ? getSettlementDeleteConfirmation(tr, amount)
        : null,
    };
  }, [
    amount,
    friendName,
    locale,
    pending,
    settlement,
    tr,
    viewerName,
    viewerUid,
    walletArchived,
    walletName,
  ]);
}
