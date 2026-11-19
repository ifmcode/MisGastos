import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Switch, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/themed-text";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { useProfileService } from "@/features/profile/hooks/use-profile-service";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useAuth } from "@/hooks/use-auth";

import { settingsStyles as styles } from "../styles/settings.styles";
import { buildSharedExpensePreferenceSaveInput } from "../utils/shared-expense-preference";

/**
 * Account preference of the shared-expense wallet toggle. It only feeds the
 * create flow: an existing expense keeps the state its own link implies.
 */
export function SettingsSharedExpenseToggle() {
  const theme = useFormTheme();
  const { t } = useTranslation("settings");
  const { user } = useAuth();
  const { profile, replaceProfile } = useProfile();
  const profileService = useProfileService();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const enabled = profile?.registerSharedExpensesInWallet ?? false;
  const disabled = saving || !profile || !user;

  function change(value: boolean) {
    if (!profile || !user || value === enabled) return;

    setSaving(true);
    setSaveError(null);

    const persist = async () => {
      try {
        const saved = await profileService.saveProfile(
          buildSharedExpensePreferenceSaveInput(
            profile,
            user.uid,
            user.email,
            value,
          ),
        );
        replaceProfile(saved);
      } catch {
        setSaveError(t("sharedExpenseWallet.saveError"));
      } finally {
        setSaving(false);
      }
    };

    void persist();
  }

  return (
    <View
      style={[
        styles.menuItem,
        styles.languageItem,
        { borderColor: theme.border, backgroundColor: theme.surface },
      ]}
    >
      <Ionicons name="wallet-outline" size={20} color={theme.primary} />
      <View style={styles.languageContent}>
        <ThemedText type="defaultSemiBold">
          {t("sharedExpenseWallet.label")}
        </ThemedText>
        <ThemedText style={[styles.helper, { color: theme.muted }]}>
          {t("sharedExpenseWallet.helper")}
        </ThemedText>
        <ThemedText style={[styles.helper, { color: theme.primary }]}>
          {enabled
            ? t("sharedExpenseWallet.on")
            : t("sharedExpenseWallet.off")}
        </ThemedText>
        {saveError ? (
          <ThemedText style={[styles.helper, { color: theme.danger }]}>
            {saveError}
          </ThemedText>
        ) : null}
      </View>
      <Switch
        value={enabled}
        onValueChange={change}
        disabled={disabled}
        trackColor={{ false: theme.border, true: theme.primary }}
        thumbColor={theme.onPrimary}
        accessibilityRole="switch"
        accessibilityLabel={t("sharedExpenseWallet.accessibility")}
        accessibilityHint={t("sharedExpenseWallet.hint")}
        accessibilityState={{ checked: enabled, disabled }}
      />
    </View>
  );
}
