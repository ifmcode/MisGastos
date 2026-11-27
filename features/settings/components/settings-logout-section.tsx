import { Modal, Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ConfirmDialog } from "@/shared/components/molecules/confirm-dialog";
import { ErrorBanner } from "@/shared/components/molecules/error-banner";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { useSettingsLogout } from "../hooks/use-settings-logout";
import { settingsStyles as styles } from "../styles/settings.styles";

/**
 * Sign-out entry point of Settings: the button, its busy line, the sign-out
 * error and the pending-changes warning. Every rule lives in
 * `useSettingsLogout`.
 */
export function SettingsLogoutSection() {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("settings");
  const logout = useSettingsLogout();
  const disabled = logout.busy || logout.checking;

  return (
    <View style={styles.logoutSection}>
      {logout.busy ? (
        <ThemedText style={[styles.logoutBusy, { color: theme.muted }]}>
          {t("logoutWarning.busy")}
        </ThemedText>
      ) : null}

      <ErrorBanner message={logout.errorMessage} />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("logout")}
        accessibilityHint={t("logoutWarning.hint")}
        accessibilityState={{ busy: disabled, disabled }}
        disabled={disabled}
        onPress={logout.requestLogout}
        style={({ pressed }) => [
          styles.logoutButton,
          { backgroundColor: theme.danger },
          disabled && styles.logoutButtonDisabled,
          pressed && styles.logoutButtonPressed,
        ]}
      >
        <ThemedText style={[styles.logoutText, { color: theme.onPrimary }]}>
          {t("logout")}
        </ThemedText>
      </Pressable>

      {/* A transparent modal keeps the shared overlay on top of the whole
          screen instead of being confined to this section's box. */}
      <Modal
        visible={logout.confirm.visible}
        transparent
        animationType="fade"
        onRequestClose={logout.confirm.close}
      >
        <ConfirmDialog
          visible={logout.confirm.visible}
          title={logout.confirm.title}
          message={logout.confirm.message}
          confirmLabel={logout.confirm.confirmLabel}
          cancelLabel={logout.confirm.cancelLabel}
          tone="danger"
          onConfirm={logout.confirm.confirm}
          onCancel={logout.confirm.close}
        />
      </Modal>
    </View>
  );
}
