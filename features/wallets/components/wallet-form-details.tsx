import { TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import {
  WalletValidationErrors,
  WALLET_NAME_MAX_LENGTH,
} from "../schemas/wallet.schema";
import { walletFormStyles as styles } from "../styles/wallet-form.styles";
import { WalletFormValues } from "../types/wallet.types";
import { getCurrencySymbol } from "../utils/money";

export interface WalletFormDetailsProps {
  values: WalletFormValues;
  errors: WalletValidationErrors;
  disabled: boolean;
  onChange: <K extends keyof WalletFormValues>(
    key: K,
    value: WalletFormValues[K],
  ) => void;
}

export function WalletFormDetails({
  values,
  errors,
  disabled,
  onChange,
}: WalletFormDetailsProps) {
  const theme = useFormTheme();

  return (
    <View>
      <ThemedText style={styles.label}>Nombre</ThemedText>
      <TextInput
        value={values.name}
        onChangeText={(value) => onChange("name", value)}
        placeholder="Ej. Cuenta principal"
        placeholderTextColor={theme.muted}
        maxLength={WALLET_NAME_MAX_LENGTH}
        editable={!disabled}
        accessibilityLabel="Nombre de la cartera"
        style={[
          styles.input,
          {
            backgroundColor: theme.surface,
            borderColor: errors.name ? theme.danger : theme.border,
            color: theme.text,
          },
        ]}
      />
      {errors.name ? (
        <ThemedText style={styles.fieldError}>{errors.name}</ThemedText>
      ) : null}

      <ThemedText style={styles.label}>Saldo inicial</ThemedText>
      <View
        style={[
          styles.balanceWrapper,
          {
            backgroundColor: theme.surface,
            borderColor: errors.initialBalance ? theme.danger : theme.border,
          },
        ]}
      >
        <ThemedText style={[styles.balanceSymbol, { color: theme.muted }]}>
          {getCurrencySymbol(values.currency)}
        </ThemedText>
        <TextInput
          value={values.initialBalance}
          onChangeText={(value) => onChange("initialBalance", value)}
          placeholder="0,00"
          placeholderTextColor={theme.muted}
          keyboardType="decimal-pad"
          inputMode="decimal"
          editable={!disabled}
          accessibilityLabel="Saldo inicial"
          style={[styles.balanceInput, { color: theme.text }]}
        />
      </View>
      {errors.initialBalance ? (
        <ThemedText style={styles.fieldError}>
          {errors.initialBalance}
        </ThemedText>
      ) : (
        <ThemedText style={[styles.helper, { color: theme.muted }]}>
          Si lo dejas vacío se usará 0.
        </ThemedText>
      )}
    </View>
  );
}
