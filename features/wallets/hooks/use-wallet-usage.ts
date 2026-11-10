import { useCallback } from "react";

import { WalletUsage } from "../types/wallet.types";
import { useWalletService } from "./use-wallet-service";

export interface UseWalletUsageOptions {
  ownerId: string | undefined;
  reportMutationError: (failure: unknown, fallback: string) => void;
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
        reportMutationError(
          new Error("unauthenticated"),
          "Debes iniciar sesión para consultar el uso de la cartera.",
        );
        return null;
      }

      try {
        return await walletService.getWalletUsage(ownerId, walletId);
      } catch (failure: unknown) {
        reportMutationError(
          failure,
          "No se pudo comprobar el uso de la cartera.",
        );
        return null;
      }
    },
    [ownerId, walletService, reportMutationError],
  );
}
