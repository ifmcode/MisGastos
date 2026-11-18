import { useMemo } from "react";

import type { Wallet } from "@/features/wallets/types/wallet.types";
import { isWalletArchived } from "@/features/wallets/utils/wallet-status";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import type { Settlement } from "../types/settlement.types";

export interface SettlementWalletInfo {
  /** Resolved name, or null when the settlement has no linked wallet. */
  name: string | null;
  archived: boolean;
}

/**
 * Resolves the receiver wallet of a settlement. Only the creditor owns it, so a
 * debtor sees a neutral "unavailable" label instead of an empty wallet; an
 * archived wallet keeps its name and is flagged so it can still be removed.
 */
export function useSettlementWalletInfo(
  settlement: Settlement | null,
  wallets: readonly Wallet[],
): SettlementWalletInfo {
  const { tr } = useScopedTranslation("settlements");
  const linkedWallet = useMemo(
    () =>
      settlement?.receiverWalletId
        ? wallets.find((wallet) => wallet.id === settlement.receiverWalletId)
        : undefined,
    [settlement?.receiverWalletId, wallets],
  );

  return {
    name: settlement?.receiverWalletId
      ? (linkedWallet?.name ?? tr("detail.walletUnavailable"))
      : null,
    archived: linkedWallet ? isWalletArchived(linkedWallet) : false,
  };
}
