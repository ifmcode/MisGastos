import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { walletFormStyles as styles } from "../styles/wallet-form.styles";

export interface WalletFormActionsProps {
  mode?: "create" | "edit";
  submitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

export function WalletFormActions({
  mode = "create",
  submitting,
  onCancel,
  onSubmit,
}: WalletFormActionsProps) {
  const theme = useFormTheme();
  const { t } = useTranslation(["wallets", "common"]);
  const isEditing = mode === "edit";
  const submitLabel = isEditing ? t("form.saveChanges") : t("form.create");

  return (
    <View style={styles.actions}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          isEditing ? t("form.cancelEdit") : t("form.cancelCreate")
        }
        onPress={onCancel}
        disabled={submitting}
        style={[
          styles.secondaryButton,
          { borderColor: theme.border, backgroundColor: theme.surface },
          submitting && styles.disabled,
        ]}
      >
        <ThemedText type="defaultSemiBold">
          {t("common:actions.cancel")}
        </ThemedText>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={submitLabel}
        onPress={onSubmit}
        disabled={submitting}
        style={[styles.primaryButton, submitting && styles.disabled]}
      >
        {submitting ? (
          <ActivityIndicator color={theme.onPrimary} />
        ) : (
          <ThemedText style={styles.primaryButtonText}>{submitLabel}</ThemedText>
        )}
      </Pressable>
    </View>
  );
}
