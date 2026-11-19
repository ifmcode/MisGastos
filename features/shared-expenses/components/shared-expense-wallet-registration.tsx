import { Switch, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { linkedMovementStyles as styles } from "../styles/shared-expense-linked-movement.styles";

export interface SharedExpenseWalletRegistrationProps {
  /** "Yes" keeps the wallet and category block of the linked movement. */
  enabled: boolean;
  disabled: boolean;
  onChange: (enabled: boolean) => void;
}

/**
 * Yes/No switch of the wallet registration. It only decides the viewer's
 * personal side: "No" keeps the expense in the shared ledger, so no wallet, no
 * category, no movement and no balance change.
 */
export function SharedExpenseWalletRegistration({
  enabled,
  disabled,
  onChange,
}: SharedExpenseWalletRegistrationProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("sharedExpenses");
  const optionText = enabled
    ? t("form.walletRegistrationYes")
    : t("form.walletRegistrationNo");

  return (
    <View
      style={[
        styles.registrationRow,
        { borderColor: theme.border, backgroundColor: theme.surface },
      ]}
    >
      <View style={styles.registrationLabel}>
        <ThemedText type="defaultSemiBold">
          {t("form.walletRegistrationLabel")}
        </ThemedText>
        <ThemedText
          style={[styles.registrationHelper, { color: theme.muted }]}
        >
          {t("form.walletRegistrationHelper")}
        </ThemedText>
        <ThemedText
          style={[styles.registrationValue, { color: theme.primary }]}
        >
          {optionText}
        </ThemedText>
      </View>

      <Switch
        value={enabled}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: theme.border, true: theme.primary }}
        thumbColor={theme.onPrimary}
        accessibilityRole="switch"
        accessibilityLabel={t("form.walletRegistrationAccessibility")}
        accessibilityHint={t("form.walletRegistrationHint")}
        accessibilityState={{ checked: enabled, disabled }}
      />
    </View>
  );
}
