import { useMemo } from "react";

import { getGroupSettlementsService } from "../services/group-settlements.factory";

/** Stable group-settlements service instance shared by every screen and hook. */
export function useGroupSettlementsService() {
  return useMemo(() => getGroupSettlementsService(), []);
}
