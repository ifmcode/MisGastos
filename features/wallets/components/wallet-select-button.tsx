import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { walletPickerStyles as styles } from "../styles/wallet-picker.styles";
import { Wallet } from "../types/wallet.types";
import { getWalletIconName } from "../utils/wallet-options";
import { isWalletArchived } from "../utils/wallet-status";

export interface WalletSelectButtonProps {
  /** Selected wallet, or `null` while the field is still empty. */
  wallet: Wallet | null;
  disabled: boolean;
  hasError?: boolean;
  /** Screen-reader context, already translated by the caller. */
  accessibilityPrefix: string;
  onPress: () => void;
}

/**
 * Single wallet trigger: the chosen wallet once there is one, otherwise the
 * translated **Select wallet** label. It only opens the popup; selection and
 * preselection belong to the caller.
 */
export function WalletSelectButton({
  wallet,
  disabled,
  hasError = false,
  accessibilityPrefix,
  onPress,
}: WalletSelectButtonProps) {
  const theme = useFormTheme();
  const { t } = useTranslation("wallets");
  const archived = wallet ? isWalletArchived(wallet) : false;
  const accessibilityLabel = wallet
    ? `${accessibilityPrefix}. ${t("picker.selectedAccessibility", {
        name: wallet.name,
      })}`
    : `${accessibilityPrefix}. ${t("picker.selectAccessibility")}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={t("picker.selectHint")}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.selectButton,
        {
          backgroundColor: theme.surface,
          borderColor: hasError ? theme.danger : theme.border,
        },
        pressed && styles.selectButtonPressed,
        !wallet && styles.selectButtonEmpty,
        disabled && styles.selectButtonDisabled,
      ]}
    >
      <View
        style={[
          styles.selectIcon,
          {
            backgroundColor: wallet
              ? `${wallet.color}1A`
              : theme.primarySoft,
          },
        ]}
      >
        <Ionicons
          name={wallet ? getWalletIconName(wallet.icon) : "wallet-outline"}
          size={20}
          color={wallet ? wallet.color : theme.primary}
          accessible={false}
        />
      </View>

      <View style={styles.selectText}>
        <ThemedText
          numberOfLines={1}
          style={[
            styles.selectLabel,
            { color: wallet ? theme.text : theme.primary },
          ]}
        >
          {wallet ? wallet.name : t("picker.select")}
        </ThemedText>

        {wallet ? (
          <View style={styles.selectMeta}>
            <ThemedText
              style={[styles.selectMetaText, { color: theme.muted }]}
              numberOfLines={1}
            >
              {wallet.currency}
            </ThemedText>
            {archived ? (
              <View
                style={[
                  styles.selectBadge,
                  { backgroundColor: theme.warningSurface },
                ]}
              >
                <ThemedText
                  style={[
                    styles.selectBadgeText,
                    { color: theme.warningText },
                  ]}
                >
                  {t("archivedBadge")}
                </ThemedText>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      <Ionicons
        name="chevron-down"
        size={18}
        color={theme.muted}
        accessible={false}
      />
    </Pressable>
  );
}
