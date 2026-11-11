import { Wallet } from "@/features/wallets/types/wallet.types";

import { Transfer } from "../types/transfer.types";

export const DELETED_TRANSFER_WALLET_NAME = "Cartera eliminada";

export interface TransferWalletNames {
  fromName: string;
  toName: string;
}

/** Resolves a transfer side using the live wallet, then its stored name. */
export function resolveTransferWalletName(
  wallet: Wallet | undefined,
  storedName: string | undefined,
): string {
  return wallet?.name ?? storedName ?? DELETED_TRANSFER_WALLET_NAME;
}

/** Both readable wallet names for a transfer row. */
export function getTransferWalletNames(
  transfer: Transfer,
  fromWallet: Wallet | undefined,
  toWallet: Wallet | undefined,
): TransferWalletNames {
  return {
    fromName: resolveTransferWalletName(fromWallet, transfer.fromWalletName),
    toName: resolveTransferWalletName(toWallet, transfer.toWalletName),
  };
}
