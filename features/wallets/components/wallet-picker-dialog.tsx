import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { walletPickerStyles as styles } from "../styles/wallet-picker.styles";
import { Wallet } from "../types/wallet.types";
import {
  WalletPickerNoneOption,
  WalletPickerNoneOptionRow,
} from "./wallet-picker-none-option";
import { WalletPickerOption } from "./wallet-picker-option";

export interface WalletPickerDialogProps {
  visible: boolean;
  wallets: readonly Wallet[];
  selectedId: string;
  disabled: boolean;
  /** Screen-reader context, already translated by the caller. */
  accessibilityPrefix: string;
  noneOption?: WalletPickerNoneOption;
  onSelect: (walletId: string) => void;
  onClose: () => void;
}

/**
 * Read-only wallet popup opened from the wallet button. It lists every wallet
 * it receives exactly once and never offers a creation action.
 */
export function WalletPickerDialog({
  visible,
  wallets,
  selectedId,
  disabled,
  accessibilityPrefix,
  noneOption,
  onSelect,
  onClose,
}: WalletPickerDialogProps) {
  const theme = useFormTheme();
  const { t } = useTranslation("wallets");
  const noneSelected = selectedId.trim().length === 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          accessible={false}
          onPress={onClose}
          style={styles.backdrop}
        />
        <View
          accessibilityViewIsModal
          onAccessibilityEscape={onClose}
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.header}>
            <ThemedText
              type="defaultSemiBold"
              accessibilityRole="header"
              style={styles.title}
            >
              {t("picker.title")}
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("picker.close")}
              onPress={onClose}
              hitSlop={8}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={20} color={theme.muted} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {noneOption ? (
              <WalletPickerNoneOptionRow
                option={noneOption}
                selected={noneSelected}
                disabled={disabled}
                onSelect={() => onSelect("")}
              />
            ) : null}

            {wallets.length === 0 ? (
              <ThemedText style={[styles.helper, { color: theme.muted }]}>
                {t("picker.empty")}
              </ThemedText>
            ) : null}

            {wallets.map((wallet) => (
              <WalletPickerOption
                key={wallet.id}
                wallet={wallet}
                selected={selectedId === wallet.id}
                disabled={disabled}
                accessibilityPrefix={accessibilityPrefix}
                onSelect={onSelect}
              />
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
