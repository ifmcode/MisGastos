import { useMemo } from "react";

import { getWalletService } from "../services/wallet.factory";

export function useWalletService() {
  return useMemo(() => getWalletService(), []);
}
