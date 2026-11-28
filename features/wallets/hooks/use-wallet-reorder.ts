import {
  Dispatch,
  SetStateAction,
  useCallback,
  useRef,
  useState,
} from "react";

import { useAuth } from "@/hooks/use-auth";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { getWalletErrorCode } from "../services/wallet.errors";
import { Wallet } from "../types/wallet.types";
import { moveWallet, WalletMoveDirection } from "../utils/wallet-order";
import { useWalletService } from "./use-wallet-service";

export interface UseWalletReorderOptions {
  /** Full collection, archived wallets included. */
  wallets: Wallet[];
  /** Active wallets, the only ones the reorder moves. */
  visibleWallets: Wallet[];
  setWallets: Dispatch<SetStateAction<Wallet[]>>;
}

export interface WalletReorder {
  reordering: boolean;
  saving: boolean;
  error: string | null;
  toggleReorder: () => void;
  move: (walletId: string, direction: WalletMoveDirection) => void;
}

/**
 * Owns the wallet reorder mode. Each move applies optimistically and the
 * previous order is restored when the persistence call fails.
 */
export function useWalletReorder({
  wallets,
  visibleWallets,
  setWallets,
}: UseWalletReorderOptions): WalletReorder {
  const { user } = useAuth();
  const { t, tr } = useScopedTranslation("wallets");
  const walletService = useWalletService();
  const [reordering, setReordering] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(false);

  const toggleReorder = useCallback(() => {
    if (savingRef.current) return;
    setError(null);
    setReordering((current) => !current);
  }, []);

  const move = useCallback(
    (walletId: string, direction: WalletMoveDirection) => {
      if (savingRef.current) return;

      if (!user) {
        setError(t("errors.SIGN_IN_REORDER"));
        return;
      }

      const result = moveWallet(
        wallets,
        walletId,
        direction,
        visibleWallets.map((wallet) => wallet.id),
      );
      if (!result) return;

      const previous = wallets;
      const orderedIds = result.wallets.map((wallet) => wallet.id);

      savingRef.current = true;
      setWallets(result.wallets);
      setSaving(true);
      setError(null);

      void walletService
        .reorderWallets(user.uid, orderedIds)
        .catch((failure: unknown) => {
          setWallets(previous);
          setError(
            tr(`errors.${getWalletErrorCode(failure, "REORDER_FAILED")}`),
          );
        })
        .finally(() => {
          savingRef.current = false;
          setSaving(false);
        });
    },
    [user, wallets, visibleWallets, setWallets, walletService, t, tr],
  );

  return {
    reordering,
    saving,
    error,
    toggleReorder,
    move,
  };
}
