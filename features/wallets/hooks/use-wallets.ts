import { useCallback, useMemo } from "react";

import { useAuth } from "@/hooks/use-auth";
import { useAsyncCollection } from "@/shared/hooks/use-async-collection";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { readCachedWallets } from "../repositories/local-wallet.cache";
import { getWalletErrorCode } from "../services/wallet.errors";
import { Wallet } from "../types/wallet.types";
import { calculateWalletTotals, WalletTotal } from "../utils/money";
import {
  getActiveWallets,
  getArchivedWallets,
} from "../utils/wallet-status";
import {
  useWalletMutations,
  WalletMutations,
} from "./use-wallet-mutations";
import { useWalletService } from "./use-wallet-service";

export interface UseWalletsResult extends WalletMutations {
  wallets: Wallet[];
  activeWallets: Wallet[];
  archivedWallets: Wallet[];
  totals: WalletTotal[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useWallets(): UseWalletsResult {
  const { user } = useAuth();
  const { tr } = useScopedTranslation("wallets");
  const walletService = useWalletService();

  const loadWallets = useCallback(
    (ownerId: string) => walletService.getWallets(ownerId),
    [walletService],
  );
  const describeLoadError = useCallback(
    (error: unknown) =>
      tr(`errors.${getWalletErrorCode(error, "LOAD_FAILED")}`),
    [tr],
  );

  const {
    items: wallets,
    setItems: setWallets,
    loading,
    refreshing,
    error,
    reload,
    refresh,
  } = useAsyncCollection<Wallet>({
    ownerId: user?.uid,
    load: loadWallets,
    describeError: describeLoadError,
    readCached: readCachedWallets,
    refreshOnReconnect: true,
  });

  const mutations = useWalletMutations({ ownerId: user?.uid, setWallets });

  const totals = useMemo(() => calculateWalletTotals(wallets), [wallets]);
  const activeWallets = useMemo(() => getActiveWallets(wallets), [wallets]);
  const archivedWallets = useMemo(
    () => getArchivedWallets(wallets),
    [wallets],
  );

  return {
    wallets,
    activeWallets,
    archivedWallets,
    totals,
    loading,
    refreshing,
    error,
    reload,
    refresh,
    ...mutations,
  };
}
