import { useTranslation } from "react-i18next";
import { TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import {
  CATEGORY_NAME_MAX_LENGTH,
  type CategoryValidationCode,
} from "../schemas/category.schema";
import { categoryFormStyles as styles } from "../styles/category-form.styles";

export interface CategoryFormNameFieldProps {
  value: string;
  error?: CategoryValidationCode;
  disabled: boolean;
  onChange: (value: string) => void;
}

export function CategoryFormNameField({
  value,
  error,
  disabled,
  onChange,
}: CategoryFormNameFieldProps) {
  const theme = useFormTheme();
  const { t } = useTranslation(["categories", "validation"]);
  const errorText = error
    ? t(`validation:categories.${error}`, {
        max: CATEGORY_NAME_MAX_LENGTH,
      })
    : null;

  return (
    <View>
      <ThemedText style={styles.label}>{t("form.name")}</ThemedText>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={t("form.namePlaceholder")}
        placeholderTextColor={theme.muted}
        maxLength={CATEGORY_NAME_MAX_LENGTH}
        editable={!disabled}
        accessibilityLabel={t("form.nameAccessibility")}
        style={[
          styles.input,
          {
            backgroundColor: theme.surface,
            borderColor: error ? theme.danger : theme.border,
            color: theme.text,
          },
        ]}
      />
      {errorText ? (
        <ThemedText style={[styles.fieldError, { color: theme.danger }]}>
          {errorText}
        </ThemedText>
      ) : null}
    </View>
  );
}
