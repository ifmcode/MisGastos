import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { Wallet } from "../types/wallet.types";
import { formatMoney } from "../utils/money";
import { getWalletIconName, getWalletTypeLabel } from "../utils/wallet-options";

export interface WalletCardProps {
  wallet: Wallet;
}

export function WalletCard({ wallet }: WalletCardProps) {
  const theme = useFormTheme();
  const isNegative = wallet.balance < 0;

  return (
    <ThemedView
      style={[
        styles.card,
        { borderColor: theme.border, backgroundColor: theme.surface },
      ]}
    >
      <View
        style={[styles.iconWrapper, { backgroundColor: `${wallet.color}1A` }]}
      >
        <Ionicons
          name={getWalletIconName(wallet.icon)}
          size={22}
          color={wallet.color}
        />
      </View>

      <View style={styles.details}>
        <ThemedText type="defaultSemiBold" numberOfLines={1}>
          {wallet.name}
        </ThemedText>
        <ThemedText style={styles.meta} numberOfLines={1}>
          {getWalletTypeLabel(wallet.type)} · {wallet.currency}
          {wallet.includeInTotal ? "" : " · Fuera del total"}
        </ThemedText>
      </View>

      <ThemedText
        type="defaultSemiBold"
        style={[styles.balance, isNegative && { color: theme.danger }]}
        numberOfLines={1}
      >
        {formatMoney(wallet.balance, wallet.currency)}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  details: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.65,
    marginTop: 2,
  },
  balance: {
    fontSize: 15,
    fontVariant: ["tabular-nums"],
    textAlign: "right",
  },
});
