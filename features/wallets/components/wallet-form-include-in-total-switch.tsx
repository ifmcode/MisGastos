import { Switch, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { walletFormStyles as styles } from "../styles/wallet-form.styles";

export interface WalletFormIncludeInTotalSwitchProps {
  value: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}

export function WalletFormIncludeInTotalSwitch({
  value,
  disabled,
  onChange,
}: WalletFormIncludeInTotalSwitchProps) {
  const theme = useFormTheme();

  return (
    <View
      style={[
        styles.switchRow,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <View style={styles.switchText}>
        <ThemedText type="defaultSemiBold">Incluir en el total</ThemedText>
        <ThemedText style={[styles.helper, { color: theme.muted }]}>
          Se sumará al saldo del dashboard.
        </ThemedText>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: theme.border, true: theme.primary }}
        thumbColor={theme.onPrimary}
        accessibilityLabel="Incluir cartera en el total"
      />
    </View>
  );
}
