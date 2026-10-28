import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/hooks/use-auth";

import {
  WalletInput,
  WalletValidationErrors,
} from "../schemas/wallet.schema";
import {
  getWalletErrorMessage,
  WalletValidationError,
} from "../services/wallet.errors";
import { Wallet } from "../types/wallet.types";
import { calculateWalletTotals, WalletTotal } from "../utils/money";
import { useWalletService } from "./use-wallet-service";

type LoadMode = "initial" | "refresh";

export interface UseWalletsResult {
  wallets: Wallet[];
  totals: WalletTotal[];
  loading: boolean;
  refreshing: boolean;
  creating: boolean;
  error: string | null;
  createError: string | null;
  createFieldErrors: WalletValidationErrors;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
  createWallet: (input: WalletInput) => Promise<boolean>;
  clearCreateState: () => void;
}

export function useWallets(): UseWalletsResult {
  const { user } = useAuth();
  const walletService = useWalletService();

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createFieldErrors, setCreateFieldErrors] =
    useState<WalletValidationErrors>({});

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
        setError(
          getWalletErrorMessage(
            loadError,
            "No se pudieron cargar las carteras. Inténtalo de nuevo.",
          ),
        );
      } finally {
        if (mode === "refresh") {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [user, walletService],
  );

  useEffect(() => {
    void loadWallets("initial");
  }, [loadWallets]);

  const reload = useCallback(() => loadWallets("initial"), [loadWallets]);
  const refresh = useCallback(() => loadWallets("refresh"), [loadWallets]);

  const createWallet = useCallback(
    async (input: WalletInput): Promise<boolean> => {
      if (!user) {
        setCreateError("Debes iniciar sesión para crear una cartera.");
        return false;
      }

      setCreating(true);
      setCreateError(null);
      setCreateFieldErrors({});

      try {
        const wallet = await walletService.createWallet(user.uid, input);
        setWallets((current) => [wallet, ...current]);
        return true;
      } catch (createFailure: unknown) {
        if (createFailure instanceof WalletValidationError) {
          setCreateFieldErrors(createFailure.fieldErrors);
          setCreateError(createFailure.message);
        } else {
          setCreateError(
            getWalletErrorMessage(
              createFailure,
              "No se pudo crear la cartera. Inténtalo de nuevo.",
            ),
          );
        }

        return false;
      } finally {
        setCreating(false);
      }
    },
    [user, walletService],
  );

  const clearCreateState = useCallback(() => {
    setCreateError(null);
    setCreateFieldErrors({});
  }, []);

  const totals = useMemo(() => calculateWalletTotals(wallets), [wallets]);

  return {
    wallets,
    totals,
    loading,
    refreshing,
    creating,
    error,
    createError,
    createFieldErrors,
    reload,
    refresh,
    createWallet,
    clearCreateState,
  };
}
