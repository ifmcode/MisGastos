import { useMemo } from "react";

import { getNotificationsService } from "../services/notifications.factory";

/** Stable notifications service instance for the inbox and the bell. */
export function useNotificationsService() {
  return useMemo(() => getNotificationsService(), []);
}
