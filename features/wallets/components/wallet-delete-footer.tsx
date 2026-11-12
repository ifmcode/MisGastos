import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { walletManagementStyles as styles } from "../styles/wallet-management.styles";

export interface WalletDeleteFooterProps {
  error: string | null;
  submitting: boolean;
  disabled: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** Error feedback plus cancel/confirm actions for the delete modal. */
export function WalletDeleteFooter({
  error,
  submitting,
  disabled,
  onConfirm,
  onClose,
}: WalletDeleteFooterProps) {
  const theme = useFormTheme();
  const { t } = useTranslation(["wallets", "common"]);

  return (
    <>
      {error ? (
        <View
          style={[
            styles.errorBanner,
            { backgroundColor: theme.dangerSurface },
          ]}
        >
          <ThemedText style={[styles.errorText, { color: theme.dangerText }]}>
            {error}
          </ThemedText>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("delete.cancel")}
          disabled={submitting}
          onPress={onClose}
          style={[styles.secondaryButton, { borderColor: theme.border }]}
        >
          <ThemedText type="defaultSemiBold">
            {t("common:actions.cancel")}
          </ThemedText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("delete.confirm")}
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPress={onConfirm}
          style={[styles.dangerButton, disabled && styles.disabled]}
        >
          {submitting ? (
            <ActivityIndicator color={theme.onPrimary} />
          ) : (
            <View style={styles.dangerContent}>
              <Ionicons
                name="trash-outline"
                size={18}
                color={theme.onPrimary}
              />
              <ThemedText style={styles.dangerButtonText}>
                {t("delete.confirmShort")}
              </ThemedText>
            </View>
          )}
        </Pressable>
      </View>
    </>
  );
}
