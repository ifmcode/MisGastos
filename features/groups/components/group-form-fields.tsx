import { TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import type { CurrencyOption } from "@/shared/components/molecules/currency-chip-selector";
import { CurrencyField } from "@/shared/components/molecules/currency-field";
import type { CurrencyCode } from "@/shared/constants/currencies";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import type { GroupValidationErrors } from "../schemas/group-validation.types";
import { groupsStyles as styles } from "../styles/groups.styles";
import {
  GROUP_DESCRIPTION_MAX_LENGTH,
  GROUP_NAME_MAX_LENGTH,
} from "../types/group.types";
import type { GroupFormValues } from "../utils/group-form";
import { GroupSimplifyDebtsField } from "./group-simplify-debts-field";

export interface GroupFormFieldsProps {
  values: GroupFormValues;
  errors: GroupValidationErrors;
  disabled: boolean;
  /** The simplify-debts setting is owner-editable, so only edits show it. */
  isEditing: boolean;
  onChangeName: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onChangeCurrency: (currency: CurrencyCode) => void;
  onChangeSimplifyDebts: (value: boolean) => void;
}

/** Name, description and default currency of the group form. */
export function GroupFormFields({
  values,
  errors,
  disabled,
  isEditing,
  onChangeName,
  onChangeDescription,
  onChangeCurrency,
  onChangeSimplifyDebts,
}: GroupFormFieldsProps) {
  const theme = useFormTheme();
  const { t, tr } = useScopedTranslation("groups");

  function errorText(code: string | undefined) {
    return code ? tr(`errors.${code}`) : null;
  }

  function currencyAccessibilityLabel(currency: CurrencyOption): string {
    return t("form.currencyAccessibility", { name: currency.name });
  }

  const nameError = errorText(errors.name);
  const descriptionError = errorText(errors.description);

  return (
    <View>
      <ThemedText style={styles.fieldLabel}>{t("form.nameLabel")}</ThemedText>
      <TextInput
        value={values.name}
        onChangeText={onChangeName}
        placeholder={t("form.namePlaceholder")}
        placeholderTextColor={theme.muted}
        editable={!disabled}
        maxLength={GROUP_NAME_MAX_LENGTH}
        accessibilityLabel={t("form.nameAccessibility")}
        style={[
          styles.input,
          {
            borderColor: nameError ? theme.danger : theme.border,
            backgroundColor: theme.surface,
            color: theme.text,
          },
        ]}
      />
      {nameError ? (
        <ThemedText style={[styles.fieldError, { color: theme.danger }]}>
          {nameError}
        </ThemedText>
      ) : null}

      <ThemedText style={styles.fieldLabel}>
        {t("form.descriptionLabel")}
      </ThemedText>
      <TextInput
        value={values.description}
        onChangeText={onChangeDescription}
        placeholder={t("form.descriptionPlaceholder")}
        placeholderTextColor={theme.muted}
        editable={!disabled}
        multiline
        maxLength={GROUP_DESCRIPTION_MAX_LENGTH}
        accessibilityLabel={t("form.descriptionAccessibility")}
        style={[
          styles.input,
          styles.textArea,
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

      <CurrencyField
        label={t("form.currencyLabel")}
        value={values.defaultCurrency}
        disabled={disabled}
        changeLabel={t("form.currencyChange")}
        changeAccessibilityLabel={t("form.currencyChangeAccessibility")}
        changeAccessibilityHint={t("form.currencyChangeHint")}
        pickerTitle={t("form.currencyPickerTitle")}
        pickerCloseAccessibilityLabel={t("form.currencyPickerClose")}
        pickerGroupAccessibilityLabel={t("form.currencyGroupAccessibility")}
        getCurrencyAccessibilityLabel={currencyAccessibilityLabel}
        onChange={onChangeCurrency}
      />
      <ThemedText style={[styles.helper, { color: theme.muted }]}>
        {t("form.currencyHelper")}
      </ThemedText>
      {errorText(errors.defaultCurrency) ? (
        <ThemedText style={[styles.fieldError, { color: theme.danger }]}>
          {errorText(errors.defaultCurrency)}
        </ThemedText>
      ) : null}

      {isEditing ? (
        <GroupSimplifyDebtsField
          value={values.simplifyDebts}
          disabled={disabled}
          onChange={onChangeSimplifyDebts}
        />
      ) : null}
    </View>
  );
}
