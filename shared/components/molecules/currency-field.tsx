import { useState } from "react";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import type { CurrencyCode } from "@/shared/constants/currencies";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { formatCurrencyLabel } from "@/shared/utils/currency-label";

import type { CurrencyOption } from "./currency-chip-selector";
import { currencyFieldStyles as styles } from "./currency-field.styles";
import { CurrencyPickerDialog } from "./currency-picker-dialog";
import { formFieldStyles } from "./form-field.styles";

export interface CurrencyFieldProps {
  /** Already translated copy; the molecule owns no translation namespace. */
  label: string;
  value: CurrencyCode;
  disabled?: boolean;
  changeLabel: string;
  changeAccessibilityLabel: string;
  changeAccessibilityHint: string;
  pickerTitle: string;
  pickerCloseAccessibilityLabel: string;
  pickerGroupAccessibilityLabel: string;
  getCurrencyAccessibilityLabel: (currency: CurrencyOption) => string;
  onChange: (currency: CurrencyCode) => void;
}

/**
 * Compact currency row: the current value and a small text action that opens
 * the picker. Selecting a currency closes the dialog and reports the change.
 */
export function CurrencyField({
  label,
  value,
  disabled = false,
  changeLabel,
  changeAccessibilityLabel,
  changeAccessibilityHint,
  pickerTitle,
  pickerCloseAccessibilityLabel,
  pickerGroupAccessibilityLabel,
  getCurrencyAccessibilityLabel,
  onChange,
}: CurrencyFieldProps) {
  const theme = useFormTheme();
  const [pickerVisible, setPickerVisible] = useState(false);

  function selectCurrency(currency: CurrencyCode) {
    setPickerVisible(false);
    onChange(currency);
  }

  return (
    <View>
      <ThemedText style={formFieldStyles.label}>{label}</ThemedText>
      <View
        style={[
          styles.row,
          { borderColor: theme.border, backgroundColor: theme.surface },
        ]}
      >
        <ThemedText style={[styles.value, { color: theme.text }]}>
          {formatCurrencyLabel(value)}
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={changeAccessibilityLabel}
          accessibilityHint={changeAccessibilityHint}
          accessibilityState={{ disabled }}
          disabled={disabled}
          hitSlop={8}
          onPress={() => setPickerVisible(true)}
          style={({ pressed }) => [
            styles.action,
            pressed && styles.pressed,
            disabled && styles.actionDisabled,
          ]}
        >
          <ThemedText style={[styles.actionText, { color: theme.primary }]}>
            {changeLabel}
          </ThemedText>
        </Pressable>
      </View>

      <CurrencyPickerDialog
        visible={pickerVisible}
        title={pickerTitle}
        closeAccessibilityLabel={pickerCloseAccessibilityLabel}
        groupAccessibilityLabel={pickerGroupAccessibilityLabel}
        value={value}
        getCurrencyAccessibilityLabel={getCurrencyAccessibilityLabel}
        onChange={selectCurrency}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
}
