import { useRouter } from "expo-router";
import { useCallback } from "react";

import { useInboxRequests } from "@/features/notifications/hooks/use-inbox-requests";
import { useNotifications } from "@/features/notifications/hooks/use-notifications";
import { countInboxBadge } from "@/features/notifications/utils/notifications.utils";
import { useAuth } from "@/hooks/use-auth";

export interface DashboardNotificationsController {
  inboxCount: number;
  openNotifications: () => void;
}

/**
 * Single bell badge of the dashboard header: unread informative notifications
 * plus the pending requests of the inbox queue. The inbox refreshes on focus,
 * so returning from `/notifications` updates the count without extra wiring.
 */
export function useDashboardNotifications(): DashboardNotificationsController {
  const router = useRouter();
  const { user } = useAuth();
  const { notifications } = useNotifications({ viewerUid: user?.uid });
  const requests = useInboxRequests();
  const inboxCount = countInboxBadge(notifications, requests.total);

  const openNotifications = useCallback(() => {
    router.push("/notifications");
  }, [router]);

  return { inboxCount, openNotifications };
}
