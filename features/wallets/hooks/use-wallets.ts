import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

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

type LoadMode = "initial" | "refresh";

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

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWallets = useCallback(
    async (mode: LoadMode) => {
      if (!user) {
        setWallets([]);
        setError(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (mode === "refresh") {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const result = await walletService.getWallets(user.uid);
        setWallets(result);
      } catch (loadError: unknown) {
        setError(tr(`errors.${getWalletErrorCode(loadError, "LOAD_FAILED")}`));
      } finally {
        if (mode === "refresh") {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [user, walletService, tr],
  );

  useEffect(() => {
    void loadWallets("initial");
  }, [loadWallets]);

  const reload = useCallback(() => loadWallets("initial"), [loadWallets]);
  const refresh = useCallback(() => loadWallets("refresh"), [loadWallets]);

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
