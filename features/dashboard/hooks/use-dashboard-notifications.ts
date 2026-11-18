import { useRouter } from "expo-router";
import { useCallback } from "react";

import { useNotifications } from "@/features/notifications/hooks/use-notifications";
import { useAuth } from "@/hooks/use-auth";

export interface DashboardNotificationsController {
  unreadCount: number;
  openNotifications: () => void;
}

/**
 * Unread badge of the dashboard header. The inbox refreshes on focus, so
 * returning from `/notifications` updates the count without extra wiring.
 */
export function useDashboardNotifications(): DashboardNotificationsController {
  const router = useRouter();
  const { user } = useAuth();
  const { unreadCount } = useNotifications({ viewerUid: user?.uid });

  const openNotifications = useCallback(() => {
    router.push("/notifications");
  }, [router]);

  return { unreadCount, openNotifications };
}
