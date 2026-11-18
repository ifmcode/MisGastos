import type { AppNotification } from "../types/notification.types";
import {
  buildNotificationRow,
  type NotificationRowContext,
  type NotificationRowIcon,
} from "./notification-rows";
import { isPendingNotification } from "./notifications.utils";

/** Routes where a banner would interrupt the very list it belongs to. */
const SUPPRESSED_ROUTES: readonly string[] = [
  "/notifications",
  "/login",
  "/verify-email",
];

export interface NotificationBannerModel {
  id: string;
  title: string;
  meta: string;
  icon: NotificationRowIcon;
  openAccessibilityLabel: string;
  openHint: string;
  closeAccessibilityLabel: string;
}

/** The inbox is the source of truth: a banner is never shown on top of it. */
export function isSuppressedNotificationRoute(pathname: string): boolean {
  return SUPPRESSED_ROUTES.includes(pathname.trim());
}

/**
 * Notifications the listener has not presented yet, in arrival order
 * (`createdAt` ascending, id as tie-breaker). Already stamped rows are history
 * and never reach the queue.
 */
export function collectArrivedNotifications(
  knownIds: ReadonlySet<string>,
  notifications: readonly AppNotification[],
): AppNotification[] {
  return notifications
    .filter(
      (notification) =>
        isPendingNotification(notification) && !knownIds.has(notification.id),
    )
    .sort((left, right) => {
      if (left.createdAt !== right.createdAt) {
        return left.createdAt < right.createdAt ? -1 : 1;
      }

      if (left.id === right.id) return 0;
      return left.id < right.id ? -1 : 1;
    });
}

/**
 * Banner view-model of one notification: the same row copy the inbox renders,
 * plus the banner-only accessibility contract. One shape for row and banner
 * means they cannot drift.
 */
export function buildNotificationBanner(
  notification: AppNotification,
  context: NotificationRowContext,
): NotificationBannerModel {
  const row = buildNotificationRow(notification, context);

  return {
    id: row.id,
    title: row.title,
    meta: row.meta,
    icon: row.icon,
    openAccessibilityLabel: context.t("banner.openAccessibility", {
      title: row.title,
    }),
    openHint: context.t("banner.openHint"),
    closeAccessibilityLabel: context.t("banner.close"),
  };
}

export interface NotificationArrivalSelection {
  /** Empty on the priming snapshot: history never pops up. */
  arrivals: AppNotification[];
  /** Every id of the current snapshot, so a re-emission is never an arrival. */
  knownIds: ReadonlySet<string>;
}

/**
 * One snapshot of the listener turned into arrivals plus the next known set.
 * The first snapshot only primes, so an inbox with unseen history cannot flood
 * the screen when the app starts.
 */
export function selectNotificationArrivals(
  knownIds: ReadonlySet<string>,
  primed: boolean,
  notifications: readonly AppNotification[],
): NotificationArrivalSelection {
  const nextKnownIds = new Set(knownIds);
  for (const notification of notifications) nextKnownIds.add(notification.id);

  return {
    arrivals: primed ? collectArrivedNotifications(knownIds, notifications) : [],
    knownIds: nextKnownIds,
  };
}

export interface NotificationPresentationGate {
  /** The inbox, sign-in or verification route is focused. */
  suppressed: boolean;
  /** `AppState.currentState === "active"`. */
  foreground: boolean;
  arrivals: readonly AppNotification[];
}

/** A banner is presented only in the foreground, elsewhere and with arrivals. */
export function shouldPresentArrivals(
  gate: NotificationPresentationGate,
): boolean {
  return !gate.suppressed && gate.foreground && gate.arrivals.length > 0;
}
