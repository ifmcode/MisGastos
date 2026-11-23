import { useMemo } from "react";

import type { GroupMember } from "@/features/groups/types/group.types";
import type { useAppLocale } from "@/shared/hooks/use-app-locale";
import type { Translate } from "@/shared/i18n/translate";
import type {
  DetailActionLabels,
  DetailDeleteConfirmation,
  DetailField,
  DetailMissingStateLabels,
  DetailSummary,
} from "@/shared/types/detail.types";

import type { GroupSettlement } from "../types/group-settlement.types";
import { getGroupMemberName } from "../utils/group-expense-members";
import {
  getGroupSettlementDeleteConfirmation,
  getGroupSettlementDetailActionLabels,
  getGroupSettlementDetailMissingLabels,
} from "./group-settlement-detail-copy";
import { buildGroupSettlementDetailFields } from "./group-settlement-detail-fields";

export interface UseGroupSettlementDetailViewOptions {
  settlement: GroupSettlement | null;
  members: readonly GroupMember[];
  groupName: string;
  viewerUid: string;
  /** Resolved name of the creditor's income wallet, or null. */
  walletName: string | null;
  walletArchived: boolean;
  /** Already formatted amount of the settlement. */
  amount: string;
  pending: boolean;
  locale: ReturnType<typeof useAppLocale>;
  tr: Translate;
}

export interface GroupSettlementDetailView {
  subtitle: string;
  summary: DetailSummary | undefined;
  fields: DetailField[];
  labels: DetailActionLabels;
  missingLabels: DetailMissingStateLabels;
  deleteConfirmation: DetailDeleteConfirmation;
}

/** Rows, subtitle and copy of the read-only group settlement detail. */
export function useGroupSettlementDetailView({
  settlement,
  members,
  groupName,
  viewerUid,
  walletName,
  walletArchived,
  amount,
  pending,
  locale,
  tr,
}: UseGroupSettlementDetailViewOptions): GroupSettlementDetailView {
  return useMemo(() => {
    const labels = getGroupSettlementDetailActionLabels(tr, amount, pending);
    const missingLabels = getGroupSettlementDetailMissingLabels(tr);
    const deleteConfirmation = getGroupSettlementDeleteConfirmation(
      tr,
      amount,
    );

    if (!settlement) {
      return {
        subtitle: "",
        summary: undefined,
        fields: [],
        labels,
        missingLabels,
        deleteConfirmation,
      };
    }

    const nameOf = (uid: string) =>
      getGroupMemberName(members, uid, {
        viewerUid,
        viewerLabel: tr("groupExpenses:viewerName"),
        fallback: tr("groupExpenses:memberFallback"),
      });

    return {
      subtitle: tr("groupExpenses:settlementDetail.subtitle", {
        from: nameOf(settlement.fromUserId),
        to: nameOf(settlement.toUserId),
        amount,
      }),
      summary: {
        label: tr("groupExpenses:settlementDetail.summaryLabel"),
        amount,
        meta: settlement.currency,
        tone: "neutral",
      },
      fields: buildGroupSettlementDetailFields(settlement, {
        members,
        groupName,
        viewerUid,
        walletName,
        walletArchived,
        locale,
        tr,
      }),
      labels,
      missingLabels,
      deleteConfirmation,
    };
  }, [
    amount,
    groupName,
    locale,
    members,
    pending,
    settlement,
    tr,
    viewerUid,
    walletArchived,
    walletName,
  ]);
}
