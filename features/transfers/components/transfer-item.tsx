import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { formatMoney } from "@/features/wallets/utils/money";
import { formatDateInput } from "@/shared/utils/date";

import {
  transferItemPalette as palette,
  transferItemStyles as styles,
} from "../styles/transfer-item.styles";
import { Transfer } from "../types/transfer.types";
import {
  EDIT_TRANSFER_HINT,
  getTransferEditLabel,
} from "../utils/transfer-item-accessibility";

export interface TransferItemProps {
  transfer: Transfer;
  fromWallet?: Wallet;
  toWallet?: Wallet;
  onPress: () => void;
}

export function TransferItem({
  transfer,
  fromWallet,
  toWallet,
  onPress,
}: TransferItemProps) {
  const colorScheme = useColorScheme() ?? "light";
  const borderColor =
    colorScheme === "dark" ? palette.borderDark : palette.borderLight;

  const fromName = fromWallet?.name ?? "Cartera eliminada";
  const toName = toWallet?.name ?? "Cartera eliminada";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={getTransferEditLabel(
        transfer,
        fromName,
        toName,
      )}
      accessibilityHint={EDIT_TRANSFER_HINT}
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      <ThemedView
        style={[styles.card, { borderColor }]}
        lightColor="#FFFFFF"
        darkColor="#1C2225"
      >
        <View style={styles.iconWrapper}>
          <Ionicons
            name="swap-horizontal"
            size={20}
            color={palette.primary}
          />
        </View>

        <View style={styles.details}>
          <ThemedText type="defaultSemiBold" numberOfLines={1}>
            {fromName} → {toName}
          </ThemedText>
          <ThemedText style={styles.meta} numberOfLines={1}>
            {formatDateInput(transfer.date)}
            {transfer.notes ? ` · ${transfer.notes}` : ""}
          </ThemedText>
        </View>

        <ThemedText
          type="defaultSemiBold"
          style={styles.amount}
          numberOfLines={1}
        >
          {formatMoney(transfer.amount, transfer.currency)}
        </ThemedText>

        <View
          style={styles.editAffordance}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Ionicons name="pencil-outline" size={15} color={palette.primary} />
        </View>
      </ThemedView>
    </Pressable>
  );
}
