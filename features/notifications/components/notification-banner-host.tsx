import { useNotificationBanner } from "../hooks/use-notification-banner";
import { NotificationBanner } from "./notification-banner";

/**
 * Root overlay of the foreground banner. It renders nothing when the queue is
 * empty, so it never intercepts touches outside a visible notification.
 */
export function NotificationBannerHost() {
  const { banner, onOpen, onDismiss } = useNotificationBanner();

  if (!banner) return null;

  return (
    <NotificationBanner banner={banner} onOpen={onOpen} onDismiss={onDismiss} />
  );
}
