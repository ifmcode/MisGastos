import {
  Transfer,
  TransferFormValues,
} from "@/features/transfers/types/transfer.types";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { getActiveWallets } from "@/features/wallets/utils/wallet-status";
import {
  DEFAULT_CURRENCY,
  type CurrencyCode,
} from "@/shared/constants/currencies";
import { getDefaultMovementIsoDate } from "@/shared/utils/date-defaults";

export interface DefaultTransferWallets {
  fromWallet: Wallet | null;
  toWallet: Wallet | null;
}

function hasSameCurrencyPartner(
  wallet: Wallet,
  wallets: readonly Wallet[],
): boolean {
  return wallets.some(
    (other) => other.id !== wallet.id && other.currency === wallet.currency,
  );
}

/** First wallet that shares its currency with another one, or the first wallet. */
function findSourceWallet(wallets: readonly Wallet[]): Wallet | null {
  return (
    wallets.find((wallet) => hasSameCurrencyPartner(wallet, wallets)) ??
    wallets[0] ??
    null
  );
}

/**
 * Picks the wallets a new transfer should start with: an active pair in the
 * profile preferred currency when one exists, otherwise the first wallet that
 * shares its currency with another one. The destination always keeps the
 * source currency because a transfer never converts.
 */
export function getDefaultTransferWallets(
  wallets: readonly Wallet[],
  preferredCurrency: CurrencyCode = DEFAULT_CURRENCY,
): DefaultTransferWallets {
  const activeWallets = getActiveWallets(wallets);
  const candidates = activeWallets.length > 0 ? activeWallets : wallets;
  const preferredSource = activeWallets.find(
    (wallet) =>
      wallet.currency === preferredCurrency &&
      hasSameCurrencyPartner(wallet, activeWallets),
  );
  const fromWallet = preferredSource ?? findSourceWallet(candidates);

  if (!fromWallet) return { fromWallet: null, toWallet: null };

  const toWallet =
    candidates.find(
      (wallet) =>
        wallet.id !== fromWallet.id && wallet.currency === fromWallet.currency,
    ) ?? null;

  return { fromWallet, toWallet };
}

/** Builds the initial values for the create/edit transfer form. */
export function buildTransferFormValues(
  wallets: readonly Wallet[],
  editingTransfer: Transfer | null,
  preferredCurrency: CurrencyCode = DEFAULT_CURRENCY,
): TransferFormValues {
  if (editingTransfer) {
    return {
      fromWalletId: editingTransfer.fromWalletId,
      toWalletId: editingTransfer.toWalletId,
      amount: String(editingTransfer.amount),
      currency: editingTransfer.currency,
      date: editingTransfer.date,
      notes: editingTransfer.notes ?? "",
    };
  }

  const { fromWallet, toWallet } = getDefaultTransferWallets(
    wallets,
    preferredCurrency,
  );

  return {
    fromWalletId: fromWallet?.id ?? "",
    toWalletId: toWallet?.id ?? "",
    amount: "",
    currency: fromWallet?.currency ?? DEFAULT_CURRENCY,
    date: getDefaultMovementIsoDate(),
    notes: "",
  };
}
