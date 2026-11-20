import { useMemo } from "react";

import { getGroupsService } from "../services/groups.factory";

/** Stable groups service instance shared by every groups screen and hook. */
export function useGroupsService() {
  return useMemo(() => getGroupsService(), []);
}
