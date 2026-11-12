import { Dispatch, SetStateAction, useCallback } from "react";

import { WalletInput, WalletValidationErrors } from "../schemas/wallet.schema";
import {
  DeleteWalletOptions,
  Wallet,
  WalletUsage,
} from "../types/wallet.types";
import { replaceWallet } from "../utils/wallet-list";
import { useWalletMutationState } from "./use-wallet-mutation-state";
import { useWalletService } from "./use-wallet-service";
import { useWalletUsage } from "./use-wallet-usage";

export interface WalletMutations {
  mutating: boolean;
  mutationError: string | null;
  mutationFieldErrors: WalletValidationErrors;
  clearMutationState: () => void;
  createWallet: (input: WalletInput) => Promise<boolean>;
  updateWallet: (walletId: string, input: WalletInput) => Promise<boolean>;
  setArchived: (walletId: string, archived: boolean) => Promise<boolean>;
  deleteWallet: (
    walletId: string,
    options: DeleteWalletOptions,
  ) => Promise<boolean>;
  getWalletUsage: (walletId: string) => Promise<WalletUsage | null>;
}

export interface UseWalletMutationsOptions {
  ownerId: string | undefined;
  setWallets: Dispatch<SetStateAction<Wallet[]>>;
}

/** Owns the wallet create/update/archive/delete flows and their error state. */
export function useWalletMutations({
  ownerId,
  setWallets,
}: UseWalletMutationsOptions): WalletMutations {
  const walletService = useWalletService();
  const {
    mutating,
    mutationError,
    mutationFieldErrors,
    clearMutationState,
    reportMutationError,
    runMutation,
  } = useWalletMutationState(ownerId);

  const createWallet = useCallback(
    (input: WalletInput) =>
      runMutation(
        async (currentOwnerId) => {
          const wallet = await walletService.createWallet(
            currentOwnerId,
            input,
          );
          setWallets((current) => [wallet, ...current]);
        },
        "CREATE_FAILED",
        "SIGN_IN_CREATE",
      ),
    [runMutation, walletService, setWallets],
  );

  const updateWallet = useCallback(
    (walletId: string, input: WalletInput) =>
      runMutation(
        async (currentOwnerId) => {
          const wallet = await walletService.updateWallet(
            currentOwnerId,
            walletId,
            input,
          );
          setWallets((current) => replaceWallet(current, wallet));
        },
        "UPDATE_FAILED",
        "SIGN_IN_UPDATE",
      ),
    [runMutation, walletService, setWallets],
  );

  const setArchived = useCallback(
    (walletId: string, archived: boolean) =>
      runMutation(
        async (currentOwnerId) => {
          const wallet = archived
            ? await walletService.archiveWallet(currentOwnerId, walletId)
            : await walletService.restoreWallet(currentOwnerId, walletId);
          setWallets((current) => replaceWallet(current, wallet));
        },
        "ARCHIVE_FAILED",
        "SIGN_IN_ARCHIVE",
      ),
    [runMutation, walletService, setWallets],
  );

  const deleteWallet = useCallback(
    (walletId: string, options: DeleteWalletOptions) =>
      runMutation(
        async (currentOwnerId) => {
          const result = await walletService.deleteWallet(
            currentOwnerId,
            walletId,
            options,
          );
          setWallets((current) => {
            const withoutDeleted = current.filter(
              (wallet) => wallet.id !== result.deletedWalletId,
            );
            return result.targetWallet
              ? replaceWallet(withoutDeleted, result.targetWallet)
              : withoutDeleted;
          });
        },
        "DELETE_FAILED",
        "SIGN_IN_DELETE",
      ),
    [runMutation, walletService, setWallets],
  );

  const getWalletUsage = useWalletUsage({ ownerId, reportMutationError });

  return {
    mutating,
    mutationError,
    mutationFieldErrors,
    clearMutationState,
    createWallet,
    updateWallet,
    setArchived,
    deleteWallet,
    getWalletUsage,
  };
}
