import { useMemo } from "react";

import { getSharedExpensesService } from "../services/shared-expenses.factory";

/** Stable shared-expenses service instance for the friends tab section. */
export function useSharedExpensesService() {
  return useMemo(() => getSharedExpensesService(), []);
}
