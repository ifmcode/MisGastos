import type { GroupMember } from "@/features/groups/types/group.types";
import type { useAppLocale } from "@/shared/hooks/use-app-locale";
import type { Translate } from "@/shared/i18n/translate";
import type { DetailField } from "@/shared/types/detail.types";

import type { GroupSettlement } from "../types/group-settlement.types";
import { getGroupMemberName } from "../utils/group-expense-members";

export interface GroupSettlementDetailFieldContext {
  members: readonly GroupMember[];
  groupName: string;
  viewerUid: string;
  /** Resolved name of the creditor's income wallet, or null. */
  walletName: string | null;
  walletArchived: boolean;
  locale: ReturnType<typeof useAppLocale>;
  tr: Translate;
}

/**
 * Read-only rows of the detail: group, pair, currency, date, note and the audit
 * stamps, plus the creditor's wallet and linked income. Only the creditor owns
 * the income, so the debtor never sees those last rows.
 */
export function buildGroupSettlementDetailFields(
  settlement: GroupSettlement,
  context: GroupSettlementDetailFieldContext,
): DetailField[] {
  const nameOf = (uid: string) =>
    getGroupMemberName(context.members, uid, {
      viewerUid: context.viewerUid,
      viewerLabel: context.tr("groupExpenses:viewerName"),
      fallback: context.tr("groupExpenses:memberFallback"),
    });
  const fields: DetailField[] = [
    {
      key: "group",
      label: context.tr("groupExpenses:settlementDetail.group"),
      value: context.groupName,
    },
    {
      key: "from",
      label: context.tr("groupExpenses:settlementDetail.from"),
      value: nameOf(settlement.fromUserId),
    },
    {
      key: "to",
      label: context.tr("groupExpenses:settlementDetail.to"),
      value: nameOf(settlement.toUserId),
    },
    {
      key: "currency",
      label: context.tr("groupExpenses:settlementDetail.currency"),
      value: settlement.currency,
    },
    {
      key: "date",
      label: context.tr("groupExpenses:settlementDetail.date"),
      value: context.locale.formatDate(settlement.date),
    },
    {
      key: "note",
      label: context.tr("groupExpenses:settlementDetail.note"),
      value:
        settlement.note.trim() || context.tr("common:states.noNotes"),
    },
    {
      key: "creator",
      label: context.tr("groupExpenses:settlementDetail.creator"),
      value: nameOf(settlement.createdBy),
    },
    {
      key: "createdAt",
      label: context.tr("groupExpenses:settlementDetail.createdAt"),
      value: context.locale.formatDateTime(settlement.createdAt),
    },
    {
      key: "updatedAt",
      label: context.tr("groupExpenses:settlementDetail.updatedAt"),
      value: context.locale.formatDateTime(settlement.updatedAt),
    },
  ];

  if (settlement.toUserId !== context.viewerUid.trim()) return fields;

  fields.push({
    key: "receiverWallet",
    label: context.tr("groupExpenses:settlementDetail.receiverWallet"),
    value: settlement.receiverWalletId
      ? context.walletName
        ? context.walletArchived
          ? `${context.walletName} · ${context.tr("groupExpenses:settlementDetail.walletArchived")}`
          : context.walletName
        : context.tr("groupExpenses:settlementDetail.walletUnavailable")
      : context.tr("groupExpenses:settlementDetail.receiverWalletNone"),
  });

  if (settlement.receiverTransactionId) {
    fields.push({
      key: "receiverMovement",
      label: context.tr("groupExpenses:settlementDetail.receiverMovement"),
      value: context.tr(
        "groupExpenses:settlementDetail.receiverMovementValue",
      ),
    });
  }

  return fields;
}
