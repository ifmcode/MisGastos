import { useCallback } from "react";

import { WalletUsage } from "../types/wallet.types";
import { useWalletService } from "./use-wallet-service";

export interface UseWalletUsageOptions {
  ownerId: string | undefined;
  reportMutationError: (
    failure: unknown,
    fallback: "USAGE_FAILED" | "SIGN_IN_USAGE",
  ) => void;
}

export type GetWalletUsage = (walletId: string) => Promise<WalletUsage | null>;

/** Loads how many movements reference a wallet, reporting failures as mutation errors. */
export function useWalletUsage({
  ownerId,
  reportMutationError,
}: UseWalletUsageOptions): GetWalletUsage {
  const walletService = useWalletService();

  return useCallback(
    async (walletId: string): Promise<WalletUsage | null> => {
      if (!ownerId) {
        reportMutationError(new Error("unauthenticated"), "SIGN_IN_USAGE");
        return null;
      }

      try {
        return await walletService.getWalletUsage(ownerId, walletId);
      } catch (failure: unknown) {
        reportMutationError(failure, "USAGE_FAILED");
        return null;
      }
    },
    [ownerId, walletService, reportMutationError],
  );
}
