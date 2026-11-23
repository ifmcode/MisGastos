import { Switch, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { linkedMovementStyles as styles } from "../styles/shared-expense-linked-movement.styles";
import type { SharedExpenseLinkScope } from "../types/shared-expense-link.types";

export interface SharedExpenseWalletRegistrationProps {
  /** "Yes" keeps the wallet and category block of the linked movement. */
  enabled: boolean;
  disabled: boolean;
  /** Copy namespace; the 1:1 form is the default, groups pass their own. */
  scope?: SharedExpenseLinkScope;
  onChange: (enabled: boolean) => void;
}

/**
 * Yes/No switch of the wallet registration, shared by the 1:1 and the group
 * forms with their own copy. It only decides the viewer's personal side: "No"
 * keeps the expense in the social ledger, so no wallet, no category, no
 * movement and no balance change.
 */
export function SharedExpenseWalletRegistration({
  enabled,
  disabled,
  scope = "sharedExpenses",
  onChange,
}: SharedExpenseWalletRegistrationProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation(scope);
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
