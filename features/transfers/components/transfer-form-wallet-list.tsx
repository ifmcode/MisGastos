import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { formatMoney } from "@/features/wallets/utils/money";

import { transferFormStyles as styles } from "../styles/transfer-form.styles";

export interface TransferFormWalletListProps {
  wallets: Wallet[];
  selectedId: string;
  disabled: boolean;
  accessibilityPrefix: "Origen" | "Destino";
  highlightNegativeBalance?: boolean;
  onSelect: (walletId: string) => void;
}

export function TransferFormWalletList({
  wallets,
  selectedId,
  disabled,
  accessibilityPrefix,
  highlightNegativeBalance = false,
  onSelect,
}: TransferFormWalletListProps) {
  const theme = useFormTheme();

  return (
    <View style={styles.walletList}>
      {wallets.map((wallet) => {
        const selected = selectedId === wallet.id;
        const balanceColor = selected
          ? theme.primary
          : highlightNegativeBalance && wallet.balance < 0
            ? theme.danger
            : theme.muted;

        return (
          <Pressable
            key={wallet.id}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${accessibilityPrefix} ${wallet.name}`}
            onPress={() => onSelect(wallet.id)}
            disabled={disabled}
            style={[
              styles.walletItem,
              {
                backgroundColor: selected ? theme.primarySoft : theme.surface,
                borderColor: selected ? theme.primary : theme.border,
              },
            ]}
          >
            <View style={styles.walletItemText}>
              <ThemedText type="defaultSemiBold" numberOfLines={1}>
                {wallet.name}
              </ThemedText>
              <ThemedText style={[styles.metaText, { color: theme.muted }]}>
                {wallet.currency}
              </ThemedText>
            </View>
            <ThemedText
              style={[styles.walletBalance, { color: balanceColor }]}
            >
              {formatMoney(wallet.balance, wallet.currency)}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}
