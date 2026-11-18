import { useMemo } from "react";

import { getSettlementsService } from "../services/settlements.factory";

/** Stable settlements service instance for the settlement screens. */
export function useSettlementsService() {
  return useMemo(() => getSettlementsService(), []);
}
