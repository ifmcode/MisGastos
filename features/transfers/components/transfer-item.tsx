import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { asTranslate } from "@/shared/i18n/translate";

import {
  transferItemPalette as palette,
  transferItemStyles as styles,
} from "../styles/transfer-item.styles";
import { Transfer } from "../types/transfer.types";
import {
  EDIT_TRANSFER_HINT_KEY,
  getTransferEditLabel,
} from "../utils/transfer-item-accessibility";
import { getTransferWalletNames } from "../utils/transfer-wallet-names";

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
  const theme = useFormTheme();
  const { t } = useTranslation("transfers");
  const tr = asTranslate(t);
  const locale = useAppLocale();
  const { fromName, toName } = getTransferWalletNames(
    transfer,
    fromWallet,
    toWallet,
    t("deletedWalletName"),
  );
  const amount = locale.formatCurrency(transfer.amount, transfer.currency);
  const date = locale.formatDate(transfer.date);
  const label = getTransferEditLabel(
    transfer,
    fromName,
    toName,
    amount,
    date,
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={tr(label.key, label.values)}
      accessibilityHint={t(EDIT_TRANSFER_HINT_KEY)}
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      <ThemedView
        style={[
          styles.card,
          { borderColor: theme.border, backgroundColor: theme.surface },
        ]}
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
            {date}
            {transfer.notes ? ` · ${transfer.notes}` : ""}
          </ThemedText>
        </View>

        <ThemedText
          type="defaultSemiBold"
          style={styles.amount}
          numberOfLines={1}
        >
          {amount}
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
