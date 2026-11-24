import type { CurrencyCode } from "@/shared/constants/currencies";
import type { Translate } from "@/shared/i18n/translate";

import {
  buildOutstandingBalancesMessage,
  type MemberOutstandingBalance,
} from "./group-member-balances";

/** Dialog fields shared by the confirmations of the details sheet. */
export interface GroupDialogCopy {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
}

export function getRemoveDialogCopy(
  name: string,
  tr: Translate,
): GroupDialogCopy {
  return {
    title: tr("details.removeDialogTitle"),
    message: tr("details.removeDialogMessage", { name }),
    confirmLabel: tr("details.removeDialogConfirm"),
    cancelLabel: tr("details.removeDialogCancel"),
  };
}

export function getCancelInvitationDialogCopy(
  name: string,
  tr: Translate,
): GroupDialogCopy {
  return {
    title: tr("details.cancelInvitationDialogTitle"),
    message: tr("details.cancelInvitationDialogMessage", { name }),
    confirmLabel: tr("details.cancelInvitationDialogConfirm"),
    cancelLabel: tr("details.cancelInvitationDialogCancel"),
  };
}

export function getLeaveDialogCopy(
  groupName: string,
  tr: Translate,
): GroupDialogCopy {
  return {
    title: tr("details.leaveDialogTitle"),
    message: tr("details.leaveDialogMessage", { group: groupName }),
    confirmLabel: tr("details.leaveDialogConfirm"),
    cancelLabel: tr("details.leaveDialogCancel"),
  };
}

export function getTransferDialogCopy(
  name: string,
  tr: Translate,
): GroupDialogCopy {
  return {
    title: tr("details.transferDialogTitle"),
    message: tr("details.transferDialogMessage", { name }),
    confirmLabel: tr("details.transferDialogConfirm"),
    cancelLabel: tr("details.transferDialogCancel"),
  };
}

export type BlockedBalanceVariant = "member" | "viewer";

export interface BlockedBalanceCopyOptions {
  /** `member` removes someone else; `viewer` is the leaving member. */
  variant: BlockedBalanceVariant;
  name?: string;
  balances: readonly MemberOutstandingBalance[];
  formatAmount: (netCents: number, currency: CurrencyCode) => string;
}

/** Title, per-currency message with direction, and the Liquidar/Cerrar actions. */
export function getBlockedBalanceDialogCopy(
  { variant, name, balances, formatAmount }: BlockedBalanceCopyOptions,
  tr: Translate,
): GroupDialogCopy {
  const isMember = variant === "member";
  const memberName = isMember
    ? name?.trim() || tr("history.unknownMember")
    : "";
  const intro = isMember
    ? tr("details.blockedBalanceIntro", { name: memberName })
    : tr("details.blockedLeaveIntro");
  const message = buildOutstandingBalancesMessage(balances, {
    intro,
    formatAmount,
    owesGroup: (amount) =>
      isMember
        ? tr("details.blockedBalanceMemberOwes", {
            name: memberName,
            amount,
          })
        : tr("details.blockedLeaveOwes", { amount }),
    groupOwes: (amount) =>
      isMember
        ? tr("details.blockedBalanceGroupOwes", {
            name: memberName,
            amount,
          })
        : tr("details.blockedLeaveGroupOwes", { amount }),
  });

  return {
    title: tr("details.blockedBalanceTitle"),
    message,
    confirmLabel: tr("details.blockedBalanceConfirm"),
    cancelLabel: tr("details.blockedBalanceCancel"),
  };
}
