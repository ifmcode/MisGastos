import { View } from "react-native";

import { Wallet } from "@/features/wallets/types/wallet.types";
import { WalletTotal } from "@/features/wallets/utils/money";

import { DashboardSummary } from "./dashboard-summary";
import { DashboardSectionHeader } from "./dashboard-section-header";
import { DashboardWalletFilters } from "./dashboard-wallet-filters";

export interface DashboardListHeaderProps {
  wallets: readonly Wallet[];
  selectedWalletId: string;
  selectedWallet: Wallet | null;
  totals: readonly WalletTotal[];
  visibleWalletsCount: number;
  onSelectWallet: (walletId: string) => void;
}

export function DashboardListHeader({
  wallets,
  selectedWalletId,
  selectedWallet,
  totals,
  visibleWalletsCount,
  onSelectWallet,
}: DashboardListHeaderProps) {
  const hasWallets = wallets.length > 0;

  if (!hasWallets) return null;

  return (
    <View>
      <DashboardWalletFilters
        wallets={wallets}
        selectedWalletId={selectedWalletId}
        onSelect={onSelectWallet}
      />
      <DashboardSummary totals={totals} selectedWallet={selectedWallet} />
      <DashboardSectionHeader
        title="Carteras"
        count={visibleWalletsCount}
      />
    </View>
  );
}
