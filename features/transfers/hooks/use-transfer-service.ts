import { useMemo } from "react";

import { getTransferService } from "../services/transfer.factory";

export function useTransferService() {
  return useMemo(() => getTransferService(), []);
}
