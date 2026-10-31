import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { getCurrencySymbol } from "@/features/wallets/utils/money";
import { getWalletTypeLabel } from "@/features/wallets/utils/wallet-options";

import { transactionFormStyles as styles } from "../styles/transaction-form.styles";

export interface TransactionFormWalletSelectorProps {
  wallets: Wallet[];
  value: string;
  error?: string;
  disabled: boolean;
  onChange: (walletId: string) => void;
}

export function TransactionFormWalletSelector({
  wallets,
  value,
  error,
  disabled,
  onChange,
}: TransactionFormWalletSelectorProps) {
  const theme = useFormTheme();

  return (
    <View>
      <ThemedText style={styles.label}>Cartera</ThemedText>

      {wallets.length === 0 ? (
        <View
          style={[
            styles.infoBanner,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <ThemedText style={[styles.infoText, { color: theme.muted }]}>
            No tienes carteras. Crea una en la pestaña "Carteras" para poder
            registrar movimientos.
          </ThemedText>
        </View>
      ) : (
        <View style={styles.walletList}>
          {wallets.map((wallet) => {
            const selected = value === wallet.id;

            return (
              <Pressable
                key={wallet.id}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={wallet.name}
                onPress={() => onChange(wallet.id)}
                disabled={disabled}
                style={[
                  styles.walletItem,
                  {
                    backgroundColor: selected
                      ? theme.primarySoft
                      : theme.surface,
                    borderColor: selected ? theme.primary : theme.border,
                  },
                ]}
              >
                <View style={styles.walletItemText}>
                  <ThemedText type="defaultSemiBold" numberOfLines={1}>
                    {wallet.name}
                  </ThemedText>
                  <ThemedText style={[styles.metaText, { color: theme.muted }]}>
                    {wallet.currency} · {getWalletTypeLabel(wallet.type)}
                  </ThemedText>
                </View>
                <ThemedText
                  style={[
                    styles.walletBalance,
                    { color: selected ? theme.primary : theme.muted },
                  ]}
                >
                  {getCurrencySymbol(wallet.currency)}{" "}
                  {wallet.balance.toFixed(2).replace(".", ",")}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      )}

      {error ? (
        <ThemedText style={styles.fieldError}>{error}</ThemedText>
      ) : null}
    </View>
  );
}
