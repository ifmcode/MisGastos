import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import {
  CurrencyChipSelector,
  type CurrencyOption,
} from "@/shared/components/molecules/currency-chip-selector";
import { formFieldStyles } from "@/shared/components/molecules/form-field.styles";
import { CurrencyCode } from "@/shared/constants/currencies";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { ProfileValidationCode } from "../schemas/profile.schema";

export interface ProfileCurrencyFieldProps {
  value: CurrencyCode;
  error?: ProfileValidationCode;
  disabled: boolean;
  onChange: (currency: CurrencyCode) => void;
}

export function ProfileCurrencyField({
  value,
  error,
  disabled,
  onChange,
}: ProfileCurrencyFieldProps) {
  const theme = useFormTheme();
  const { t } = useTranslation(["profile", "validation"]);

  function getAccessibilityLabel(currency: CurrencyOption): string {
    return t("form.currencyAccessibility", { name: currency.code });
  }

  return (
    <View>
      <ThemedText style={formFieldStyles.label}>
        {t("form.currency")}
      </ThemedText>
      <CurrencyChipSelector
        value={value}
        disabled={disabled}
        getAccessibilityLabel={getAccessibilityLabel}
        onChange={onChange}
      />
      {error ? (
        <ThemedText
          style={[formFieldStyles.fieldError, { color: theme.danger }]}
        >
          {t(`validation:profile.${error}`)}
        </ThemedText>
      ) : (
        <ThemedText style={[formFieldStyles.helper, { color: theme.muted }]}>
          {t("form.currencyHint")}
        </ThemedText>
      )}
    </View>
  );
}
