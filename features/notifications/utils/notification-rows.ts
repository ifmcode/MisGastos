import { centsToAmount } from "@/features/friends/utils/friend-balance";
import { findFriendByUid } from "@/features/friends/utils/friend-detail";
import { getFriendDisplayName } from "@/features/friends/utils/friend-display";
import type { Friend } from "@/features/friends/types/friend.types";
import type { CurrencyCode } from "@/shared/constants/currencies";
import { resolveCurrencyCode } from "@/shared/constants/currencies";
import type { Translate } from "@/shared/i18n/translate";
import { joinMetaParts } from "@/shared/utils/join-meta";

import type {
  AppNotification,
  NotificationPayload,
} from "../types/notification.types";
import {
  type NotificationIcon,
  resolveNotificationCopy,
} from "./notification-copy";
import {
  isSettlementNotificationType,
  isUnreadNotification,
} from "./notifications.utils";

export type NotificationRowIcon = NotificationIcon;

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
  /** Actor already resolved (banner); when present it wins over `friends`. */
  actorName?: string | null;
  formatCurrency: (value: number, currency: CurrencyCode) => string;
  formatRelativeDate: (value: string) => string;
  t: Translate;
}

function readAmountCents(payload: NotificationPayload): number {
  const value = payload.amountCents;

  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

/** Denormalized group name of a `group-invite`; "" for every other type. */
function readGroupName(payload: NotificationPayload): string {
  const value = payload.groupName;

  return typeof value === "string" ? value.trim() : "";
}

function readActorName(
  payload: NotificationPayload,
  context: NotificationRowContext,
): string {
  if (context.actorName) return context.actorName;

  const friendUid = payload.friendUid;
  const friend =
    typeof friendUid === "string"
      ? findFriendByUid(context.friends, friendUid)
      : null;

  return friend ? getFriendDisplayName(friend) : context.t("actorFallback");
}

/**
 * Presentation model of one inbox row or banner: the copy is resolved from
 * `type` and the numeric payload, the meta line is the localized relative date
 * and the unread marker always comes from `readAt`, in both segments.
 */
export function buildNotificationRow(
  notification: AppNotification,
  context: NotificationRowContext,
): NotificationRowModel {
  const payload = notification.payload;
  const amount = isSettlementNotificationType(notification.type)
    ? context.formatCurrency(
        centsToAmount(readAmountCents(payload)),
        resolveCurrencyCode(payload.currency),
      )
    : "";
  const copy = resolveNotificationCopy(notification, {
    actorName: readActorName(payload, context),
    amount,
    groupName: readGroupName(payload),
    t: context.t,
  });
  const unread = isUnreadNotification(notification);
  const openLabel = context.t("row.openAccessibility", { title: copy.title });

  return {
    id: notification.id,
    title: copy.title,
    meta: context.formatRelativeDate(notification.createdAt),
    icon: copy.icon,
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
}

export function buildNotificationRows(
  notifications: readonly AppNotification[],
  context: NotificationRowContext,
): NotificationRowModel[] {
  return notifications.map((notification) =>
    buildNotificationRow(notification, context),
  );
}
