import { Switch, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { groupsStyles as styles } from "../styles/groups.styles";

export interface GroupSimplifyDebtsFieldProps {
  value: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}

/**
 * Owner setting of the edit form: the suggested transfers are simplified when
 * it is on and the direct debts of each expense when it is off. Creation always
 * starts on, so the form only shows this row while editing.
 */
export function GroupSimplifyDebtsField({
  value,
  disabled,
  onChange,
}: GroupSimplifyDebtsFieldProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("groups");

  return (
    <View style={styles.switchRow}>
      <View style={styles.switchBody}>
        <ThemedText style={styles.switchLabel}>
          {t("form.simplifyDebtsLabel")}
        </ThemedText>
        <ThemedText style={[styles.switchHelper, { color: theme.muted }]}>
          {t("form.simplifyDebtsHelper")}
        </ThemedText>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: theme.border, true: theme.primary }}
        thumbColor={theme.onPrimary}
        accessibilityRole="switch"
        accessibilityLabel={t("form.simplifyDebtsAccessibility")}
        accessibilityHint={t("form.simplifyDebtsHint")}
        accessibilityState={{ checked: value, disabled }}
      />
    </View>
  );
}
