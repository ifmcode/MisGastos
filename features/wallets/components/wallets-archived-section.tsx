import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { walletManagementStyles as styles } from "../styles/wallet-management.styles";
import { Wallet } from "../types/wallet.types";
import { WalletCard } from "./wallet-card";

export interface WalletsArchivedSectionProps {
  wallets: readonly Wallet[];
  onWalletPress: (wallet: Wallet) => void;
}

/** Archived wallets stay reachable from their own section with a clear badge. */
export function WalletsArchivedSection({
  wallets,
  onWalletPress,
}: WalletsArchivedSectionProps) {
  const theme = useFormTheme();
  const { t } = useTranslation("wallets");

  if (wallets.length === 0) return null;

  return (
    <View>
      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>
          {t("archivedTitle")}
        </ThemedText>
        <ThemedText style={[styles.sectionCount, { color: theme.muted }]}>
          {wallets.length}
        </ThemedText>
      </View>
      <ThemedText style={[styles.sectionHint, { color: theme.muted }]}>
        {t("archivedHint")}
      </ThemedText>
      <View style={styles.sectionList}>
        {wallets.map((wallet) => (
          <WalletCard
            key={wallet.id}
            wallet={wallet}
            onPress={onWalletPress}
          />
        ))}
      </View>
    </View>
  );
}
