import { TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { getCurrencySymbol } from "@/features/wallets/utils/money";
import { AmountField } from "@/shared/components/molecules/amount-field";
import type { CurrencyOption } from "@/shared/components/molecules/currency-chip-selector";
import { CurrencyField } from "@/shared/components/molecules/currency-field";
import { DateFormField } from "@/shared/components/molecules/date-form-field";
import type { CurrencyCode } from "@/shared/constants/currencies";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import {
  SHARED_EXPENSE_DESCRIPTION_MAX_LENGTH,
  type SharedExpenseFieldErrors,
  type SharedExpenseValidationCode,
} from "../schemas/shared-expense.schema";
import { sharedExpensesStyles as styles } from "../styles/shared-expenses.styles";
import type { SharedExpenseFormValues } from "../utils/shared-expense-form";

export interface SharedExpenseFormMainFieldsProps {
  values: SharedExpenseFormValues;
  errors: SharedExpenseFieldErrors;
  disabled: boolean;
  onDescriptionChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onCurrencyChange: (currency: CurrencyCode) => void;
  onDateSelect: (isoDate: string) => void;
}

/** Description, total, currency and date of the shared expense form. */
export function SharedExpenseFormMainFields({
  values,
  errors,
  disabled,
  onDescriptionChange,
  onAmountChange,
  onCurrencyChange,
  onDateSelect,
}: SharedExpenseFormMainFieldsProps) {
  const theme = useFormTheme();
  const { t, tr } = useScopedTranslation("sharedExpenses");

  function errorText(code: SharedExpenseValidationCode | undefined) {
    return code ? tr(`errors.${code}`) : null;
  }

  function currencyAccessibilityLabel(currency: CurrencyOption): string {
    return t("form.currencyAccessibility", { name: currency.code });
  }

  const descriptionError = errorText(errors.description);

  return (
    <View>
      <ThemedText style={styles.label}>
        {t("form.descriptionLabel")}
      </ThemedText>
      <TextInput
        value={values.description}
        onChangeText={onDescriptionChange}
        placeholder={t("form.descriptionPlaceholder")}
        placeholderTextColor={theme.muted}
        editable={!disabled}
        maxLength={SHARED_EXPENSE_DESCRIPTION_MAX_LENGTH}
        accessibilityLabel={t("form.descriptionAccessibility")}
        style={[
          styles.textInput,
          {
            borderColor: descriptionError ? theme.danger : theme.border,
            backgroundColor: theme.surface,
            color: theme.text,
          },
        ]}
      />
      {descriptionError ? (
        <ThemedText style={[styles.fieldError, { color: theme.danger }]}>
          {descriptionError}
        </ThemedText>
      ) : null}

      <AmountField
        label={t("form.amountLabel")}
        value={values.amount}
        symbol={getCurrencySymbol(values.currency)}
        placeholder={t("form.amountPlaceholder")}
        accessibilityLabel={t("form.amountAccessibility")}
        errorText={errorText(errors.amount)}
        helperText={t("form.amountHelper")}
        disabled={disabled}
        onChange={onAmountChange}
      />

      <CurrencyField
        label={t("form.currencyLabel")}
        value={values.currency}
        disabled={disabled}
        changeLabel={t("form.currencyChange")}
        changeAccessibilityLabel={t("form.currencyChangeAccessibility")}
        changeAccessibilityHint={t("form.currencyChangeHint")}
        pickerTitle={t("form.currencyPickerTitle")}
        pickerCloseAccessibilityLabel={t("form.currencyPickerClose")}
        pickerGroupAccessibilityLabel={t("form.currencyGroupAccessibility")}
        getCurrencyAccessibilityLabel={currencyAccessibilityLabel}
        onChange={onCurrencyChange}
      />
      {errorText(errors.currency) ? (
        <ThemedText style={[styles.fieldError, { color: theme.danger }]}>
          {errorText(errors.currency)}
        </ThemedText>
      ) : null}

      <DateFormField
        label={t("form.dateLabel")}
        valueIso={values.date}
        error={errorText(errors.date) ?? undefined}
        accessibilityLabel={t("form.dateAccessibility")}
        disabled={disabled}
        onSelectDate={onDateSelect}
      />
    </View>
  );
}
