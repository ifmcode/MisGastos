import { useMemo } from "react";

import { getTransactionService } from "../services/transaction.factory";

export function useTransactionService() {
  return useMemo(() => getTransactionService(), []);
}
