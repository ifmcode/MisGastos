import { Wallet } from "@/features/wallets/types/wallet.types";

import { Transfer } from "../types/transfer.types";

export const DELETED_TRANSFER_WALLET_NAME_KEY = "deletedWalletName";

export interface TransferWalletNames {
  fromName: string;
  toName: string;
}

/** Resolves a transfer side using the live wallet, then its stored name. */
export function resolveTransferWalletName(
  wallet: Wallet | undefined,
  storedName: string | undefined,
  fallback = DELETED_TRANSFER_WALLET_NAME_KEY,
): string {
  return wallet?.name ?? storedName ?? fallback;
}

/** Both readable wallet names for a transfer row. */
export function getTransferWalletNames(
  transfer: Transfer,
  fromWallet: Wallet | undefined,
  toWallet: Wallet | undefined,
  fallback = DELETED_TRANSFER_WALLET_NAME_KEY,
): TransferWalletNames {
  return {
    fromName: resolveTransferWalletName(
      fromWallet,
      transfer.fromWalletName,
      fallback,
    ),
    toName: resolveTransferWalletName(
      toWallet,
      transfer.toWalletName,
      fallback,
    ),
  };
}
