import { useMemo } from "react";

import { getGroupExpensesService } from "../services/group-expenses.factory";

/** Stable group-expenses service instance shared by every screen and hook. */
export function useGroupExpensesService() {
  return useMemo(() => getGroupExpensesService(), []);
}
