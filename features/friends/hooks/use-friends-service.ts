import { useMemo } from "react";

import { getFriendsService } from "../services/friends.factory";

/** Stable friends service instance for screens and the profile sync. */
export function useFriendsService() {
  return useMemo(() => getFriendsService(), []);
}
