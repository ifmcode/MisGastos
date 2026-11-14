import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { formFieldStyles as styles } from "@/shared/components/molecules/form-field.styles";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { asTranslate } from "@/shared/i18n/translate";

import { WalletValidationErrors } from "../schemas/wallet.schema";
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
  currencyLocked?: boolean;
  onChange: <K extends keyof WalletFormValues>(
    key: K,
    value: WalletFormValues[K],
  ) => void;
}

export function WalletFormAppearance({
  values,
  errors,
  disabled,
  currencyLocked = false,
  onChange,
}: WalletFormAppearanceProps) {
  const theme = useFormTheme();
  const { t } = useTranslation(["wallets", "validation"]);
  const tr = asTranslate(t);

  function errorText(code: string | undefined): string | null {
    return code ? tr(`validation:wallets.${code}`) : null;
  }

  return (
    <View>
      <ThemedText style={styles.label}>{t("form.currency")}</ThemedText>
      <WalletFormCurrencySelector
        value={values.currency}
        disabled={disabled || currencyLocked}
        onChange={(currency) => onChange("currency", currency)}
      />
      {errorText(errors.currency) ? (
        <ThemedText style={[styles.fieldError, { color: theme.danger }]}>
          {errorText(errors.currency)}
        </ThemedText>
      ) : currencyLocked ? (
        <ThemedText style={[styles.helper, { color: theme.muted }]}>
          {t("form.currencyLocked")}
        </ThemedText>
      ) : null}

      <ThemedText style={styles.label}>{t("form.type")}</ThemedText>
      <WalletFormTypeSelector
        value={values.type}
        disabled={disabled}
        onChange={(type) => onChange("type", type)}
      />
      {errorText(errors.type) ? (
        <ThemedText style={[styles.fieldError, { color: theme.danger }]}>
          {errorText(errors.type)}
        </ThemedText>
      ) : null}

      <ThemedText style={styles.label}>{t("form.icon")}</ThemedText>
      <WalletFormIconSelector
        value={values.icon}
        disabled={disabled}
        onChange={(icon) => onChange("icon", icon)}
      />
      {errorText(errors.icon) ? (
        <ThemedText style={[styles.fieldError, { color: theme.danger }]}>
          {errorText(errors.icon)}
        </ThemedText>
      ) : null}

      <ThemedText style={styles.label}>{t("form.color")}</ThemedText>
      <WalletFormColorSelector
        value={values.color}
        disabled={disabled}
        onChange={(color) => onChange("color", color)}
      />
      {errorText(errors.color) ? (
        <ThemedText style={[styles.fieldError, { color: theme.danger }]}>
          {errorText(errors.color)}
        </ThemedText>
      ) : null}

      <WalletFormIncludeInTotalSwitch
        value={values.includeInTotal}
        disabled={disabled}
        onChange={(value) => onChange("includeInTotal", value)}
      />
    </View>
  );
}
