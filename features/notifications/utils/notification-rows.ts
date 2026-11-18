import type { Friend } from "@/features/friends/types/friend.types";
import { findFriendByUid } from "@/features/friends/utils/friend-detail";
import { getFriendDisplayName } from "@/features/friends/utils/friend-display";
import { centsToAmount } from "@/features/friends/utils/friend-balance";
import type { CurrencyCode } from "@/shared/constants/currencies";
import { resolveCurrencyCode } from "@/shared/constants/currencies";
import type { Translate } from "@/shared/i18n/translate";
import { joinMetaParts } from "@/shared/utils/join-meta";

import type {
  AppNotification,
  NotificationPayload,
  NotificationType,
} from "../types/notification.types";

export type NotificationRowIcon =
  | "notifications-outline"
  | "checkmark-circle-outline"
  | "create-outline"
  | "trash-outline";

export interface NotificationRowModel {
  id: string;
  title: string;
  meta: string;
  icon: NotificationRowIcon;
  unread: boolean;
  accessibilityLabel: string;
  accessibilityHint: string;
}

export interface NotificationRowContext {
  friends: readonly Friend[];
  formatCurrency: (value: number, currency: CurrencyCode) => string;
  formatDateTime: (value: string) => string;
  t: Translate;
}

const ICONS: Record<NotificationType, NotificationRowIcon> = {
  "settlement-created": "checkmark-circle-outline",
  "settlement-updated": "create-outline",
  "settlement-deleted": "trash-outline",
};

function isUnread(notification: AppNotification): boolean {
  return notification.readAt === null || notification.readAt.length === 0;
}

function readAmountCents(payload: NotificationPayload): number {
  const value = payload.amountCents;

  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readActorName(
  payload: NotificationPayload,
  context: NotificationRowContext,
): string {
  const friendUid = payload.friendUid;
  const friend =
    typeof friendUid === "string"
      ? findFriendByUid(context.friends, friendUid)
      : null;

  return friend ? getFriendDisplayName(friend) : context.t("actorFallback");
}

/**
 * Presentation model of each inbox row: the copy is resolved from `type` and the
 * numeric payload, so the stored document never carries a sentence and the
 * inbox follows a locale change.
 */
export function buildNotificationRows(
  notifications: readonly AppNotification[],
  context: NotificationRowContext,
): NotificationRowModel[] {
  return notifications.map((notification) => {
    const payload = notification.payload;
    const amount = context.formatCurrency(
      centsToAmount(readAmountCents(payload)),
      resolveCurrencyCode(payload.currency),
    );
    const title = context.t(
      `types.${notification.type}.${payload.isFull === true ? "full" : "partial"}`,
      { name: readActorName(payload, context), amount },
    );
    const unread = isUnread(notification);
    const openLabel = context.t("row.openAccessibility", { title });

    return {
      id: notification.id,
      title,
      meta: context.formatDateTime(notification.createdAt),
      icon: ICONS[notification.type],
      unread,
      accessibilityLabel: unread
        ? joinMetaParts([context.t("unread"), openLabel])
        : openLabel,
      accessibilityHint: joinMetaParts(
        [
          context.t("row.openHint"),
          payload.canLinkWallet === true
            ? context.t("row.settlementWalletHint")
            : null,
        ],
        " ",
      ),
    };
  });
}
