import type { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

import type { Translate } from "@/shared/i18n/translate";

import type {
  AppNotification,
  NotificationType,
} from "../types/notification.types";
import { isSettlementNotificationType } from "./notifications.utils";

export type NotificationIcon = ComponentProps<typeof Ionicons>["name"];

/** Everything the sentence needs; the payload only carries ids and numbers. */
export interface NotificationCopyContext {
  actorName: string;
  amount: string;
  /** Denormalized group name of a `group-invite`; "" for other types. */
  groupName: string;
  t: Translate;
}

export interface NotificationCopy {
  title: string;
  icon: NotificationIcon;
}

const FALLBACK_ICON: NotificationIcon = "notifications-outline";

const ICONS: Record<NotificationType, NotificationIcon> = {
  "settlement-created": "checkmark-circle-outline",
  "settlement-updated": "create-outline",
  "settlement-deleted": "trash-outline",
  "friend-request": "person-add-outline",
  "friend-request-accepted": "person-circle-outline",
  "group-expense": "people-outline",
  "group-settlement": "swap-horizontal-outline",
  "group-invite": "mail-unread-outline",
};

/** Icon of the event; a legacy or unknown type keeps the neutral bell. */
export function getNotificationIcon(type: string): NotificationIcon {
  return ICONS[type as NotificationType] ?? FALLBACK_ICON;
}

/**
 * Sentence and icon of a notification, resolved from `type` + payload so the
 * row and the banner never drift. Settlement events answer with the full or
 * partial variant; a group invite names the actor and the group; the reserved
 * types have no amount yet, so they use one flat sentence with the actor name.
 */
export function resolveNotificationCopy(
  notification: AppNotification,
  context: NotificationCopyContext,
): NotificationCopy {
  const icon = getNotificationIcon(notification.type);

  if (isSettlementNotificationType(notification.type)) {
    const variant = notification.payload.isFull === true ? "full" : "partial";

    return {
      title: context.t(`types.${notification.type}.${variant}`, {
        name: context.actorName,
        amount: context.amount,
      }),
      icon,
    };
  }

  if (notification.type === "group-invite") {
    return {
      title: context.t("types.group-invite", {
        name: context.actorName,
        group: context.groupName,
      }),
      icon,
    };
  }

  return {
    title: context.t(`types.${notification.type}`, { name: context.actorName }),
    icon,
  };
}
