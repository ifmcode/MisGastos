import type { CurrencyCode } from "@/shared/constants/currencies";
import type { Translate } from "@/shared/i18n/translate";
import type {
  DetailField,
  DetailSummary,
} from "@/shared/types/detail.types";

import type { Settlement } from "../types/settlement.types";

export interface SettlementDetailContext {
  viewerUid: string;
  /** Display name of the signed-in user, used for the creator field. */
  viewerName: string;
  friendName: string;
  /** Resolved wallet name, or null when nothing is linked. */
  walletName: string | null;
  walletArchived: boolean;
  formatCurrency: (value: number, currency: CurrencyCode) => string;
  formatDate: (isoDate: string) => string;
  formatDateTime: (isoDate: string) => string;
  t: Translate;
}

function isCreditor(settlement: Settlement, viewerUid: string): boolean {
  return settlement.toUserId === viewerUid;
}

function formatAmount(
  settlement: Settlement,
  context: SettlementDetailContext,
): string {
  return context.formatCurrency(settlement.amountCents / 100, settlement.currency);
}

/** Subtitle sentence of the detail: who paid whom and how much. */
export function getSettlementDetailSubtitle(
  settlement: Settlement,
  context: SettlementDetailContext,
): string {
  const amount = formatAmount(settlement, context);

  return isCreditor(settlement, context.viewerUid)
    ? context.t("message.youReceived", {
        name: context.friendName,
        amount,
      })
    : context.t("message.youPaid", { name: context.friendName, amount });
}

export function getSettlementDetailSummary(
  settlement: Settlement,
  context: SettlementDetailContext,
): DetailSummary {
  return {
    label: context.t("detail.title"),
    amount: formatAmount(settlement, context),
    meta: settlement.currency,
    tone: "neutral",
  };
}

/** Read-only rows of the settlement detail, including the creditor's link. */
export function getSettlementDetailFields(
  settlement: Settlement,
  context: SettlementDetailContext,
): DetailField[] {  const fields: DetailField[] = [
    {
      key: "amount",
      label: context.t("detail.amount"),
      value: formatAmount(settlement, context),
    },
    {
      key: "direction",
      label: context.t("detail.direction"),
      value: isCreditor(settlement, context.viewerUid)
        ? context.t("direction.friendPaid", { name: context.friendName })
        : context.t("direction.youPaid"),
    },
    {
      key: "friend",
      label: context.t("detail.friend"),
      value: context.friendName,
    },
    {
      key: "currency",
      label: context.t("detail.currency"),
      value: settlement.currency,
    },
    {
      key: "date",
      label: context.t("detail.date"),
      value: context.formatDate(settlement.date),
    },
    {
      key: "note",
      label: context.t("detail.note"),
      value: settlement.note.trim() || context.t("common:states.noNotes"),
    },
    {
      key: "creator",
      label: context.t("detail.creator"),
      value:
        settlement.createdBy === context.viewerUid
          ? context.viewerName
          : context.friendName,
    },
    {
      key: "createdAt",
      label: context.t("detail.createdAt"),
      value: context.formatDateTime(settlement.createdAt),
    },
    {
      key: "updatedAt",
      label: context.t("detail.updatedAt"),
      value: context.formatDateTime(settlement.updatedAt),
    },
    {
      key: "receiverWallet",
      label: context.t("detail.receiverWallet"),
      value: context.walletName
        ? context.walletArchived
          ? `${context.walletName} · ${context.t("detail.walletArchived")}`
          : context.walletName
        : context.t("detail.receiverWalletNone"),
    },
  ];

  if (settlement.receiverTransactionId) {
    fields.push({
      key: "receiverMovement",
      label: context.t("detail.receiverMovement"),
      value: context.t("detail.receiverMovementValue"),
    });
  }

  return fields;
}
