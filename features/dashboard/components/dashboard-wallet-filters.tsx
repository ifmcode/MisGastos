import { ScrollView } from "react-native";

import { Wallet } from "@/features/wallets/types/wallet.types";

import { dashboardStyles } from "../styles/dashboard.styles";
import { DashboardWalletFilterChip } from "./dashboard-wallet-filter-chip";

export interface DashboardWalletFiltersProps {
  wallets: readonly Wallet[];
  selectedWalletId: string;
  onSelect: (walletId: string) => void;
}

export function DashboardWalletFilters({
  wallets,
  selectedWalletId,
  onSelect,
}: DashboardWalletFiltersProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={dashboardStyles.filterRow}
    >
      <DashboardWalletFilterChip
        label="Todas"
        accessibilityLabel="Todas las carteras"
        selected={selectedWalletId === ""}
        onPress={() => onSelect("")}
      />

      {wallets.map((wallet) => (
        <DashboardWalletFilterChip
          key={wallet.id}
          label={wallet.name}
          accessibilityLabel={`Filtrar por ${wallet.name}`}
          dotColor={wallet.color}
          selected={selectedWalletId === wallet.id}
          onPress={() => onSelect(wallet.id)}
        />
      ))}
    </ScrollView>
  );
}
