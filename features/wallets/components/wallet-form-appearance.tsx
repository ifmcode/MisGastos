import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";

import { WalletValidationErrors } from "../schemas/wallet.schema";
import { walletFormStyles as styles } from "../styles/wallet-form.styles";
import { WalletFormValues } from "../types/wallet.types";
import { WalletFormColorSelector } from "./wallet-form-color-selector";
import { WalletFormCurrencySelector } from "./wallet-form-currency-selector";
import { WalletFormIconSelector } from "./wallet-form-icon-selector";
import { WalletFormIncludeInTotalSwitch } from "./wallet-form-include-in-total-switch";
import { WalletFormTypeSelector } from "./wallet-form-type-selector";

export interface WalletFormAppearanceProps {
  values: WalletFormValues;
  errors: WalletValidationErrors;
  disabled: boolean;
  onChange: <K extends keyof WalletFormValues>(
    key: K,
    value: WalletFormValues[K],
  ) => void;
}

export function WalletFormAppearance({
  values,
  errors,
  disabled,
  onChange,
}: WalletFormAppearanceProps) {
  return (
    <View>
      <ThemedText style={styles.label}>Moneda</ThemedText>
      <WalletFormCurrencySelector
        value={values.currency}
        disabled={disabled}
        onChange={(currency) => onChange("currency", currency)}
      />
      {errors.currency ? (
        <ThemedText style={styles.fieldError}>{errors.currency}</ThemedText>
      ) : null}

      <ThemedText style={styles.label}>Tipo</ThemedText>
      <WalletFormTypeSelector
        value={values.type}
        disabled={disabled}
        onChange={(type) => onChange("type", type)}
      />
      {errors.type ? (
        <ThemedText style={styles.fieldError}>{errors.type}</ThemedText>
      ) : null}

      <ThemedText style={styles.label}>Icono</ThemedText>
      <WalletFormIconSelector
        value={values.icon}
        disabled={disabled}
        onChange={(icon) => onChange("icon", icon)}
      />
      {errors.icon ? (
        <ThemedText style={styles.fieldError}>{errors.icon}</ThemedText>
      ) : null}

      <ThemedText style={styles.label}>Color</ThemedText>
      <WalletFormColorSelector
        value={values.color}
        disabled={disabled}
        onChange={(color) => onChange("color", color)}
      />
      {errors.color ? (
        <ThemedText style={styles.fieldError}>{errors.color}</ThemedText>
      ) : null}

      <WalletFormIncludeInTotalSwitch
        value={values.includeInTotal}
        disabled={disabled}
        onChange={(value) => onChange("includeInTotal", value)}
      />
    </View>
  );
}
