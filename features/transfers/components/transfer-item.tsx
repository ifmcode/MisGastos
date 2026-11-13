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
  getTransferDetailLabel,
  getTransferEditLabel,
  OPEN_TRANSFER_DETAIL_HINT_KEY,
} from "../utils/transfer-item-accessibility";
import { getTransferWalletNames } from "../utils/transfer-wallet-names";

export interface TransferItemProps {
  transfer: Transfer;
  fromWallet?: Wallet;
  toWallet?: Wallet;
  /** Switches the announced action when the row opens the read-only detail. */
  labelKind?: "edit" | "detail";
  /** Overrides the default hint for the selected label kind. */
  accessibilityHint?: string;
  onPress: () => void;
}

export function TransferItem({
  transfer,
  fromWallet,
  toWallet,
  labelKind = "edit",
  accessibilityHint,
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
  const label =
    labelKind === "detail"
      ? getTransferDetailLabel(transfer, fromName, toName, amount, date)
      : getTransferEditLabel(transfer, fromName, toName, amount, date);
  const hint =
    accessibilityHint ??
    t(
      labelKind === "detail"
        ? OPEN_TRANSFER_DETAIL_HINT_KEY
        : EDIT_TRANSFER_HINT_KEY,
    );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={tr(label.key, label.values)}
      accessibilityHint={hint}
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
          <Ionicons name="chevron-forward" size={15} color={palette.primary} />
        </View>
      </ThemedView>
    </Pressable>
  );
}
