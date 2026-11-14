import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { formFieldStyles as styles } from "@/shared/components/molecules/form-field.styles";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { asTranslate } from "@/shared/i18n/translate";

import { CategoryValidationErrors } from "../schemas/category.schema";
import { CategoryFormValues } from "../types/category.types";
import { CategoryFormColorSelector } from "./category-form-color-selector";
import { CategoryFormIconSelector } from "./category-form-icon-selector";
import { CategoryFormTypeSelector } from "./category-form-type-selector";

export interface CategoryFormAppearanceProps {
  values: CategoryFormValues;
  errors: CategoryValidationErrors;
  typeLocked: boolean;
  disabled: boolean;
  onChange: <K extends keyof CategoryFormValues>(
    key: K,
    value: CategoryFormValues[K],
  ) => void;
}

export function CategoryFormAppearance({
  values,
  errors,
  typeLocked,
  disabled,
  onChange,
}: CategoryFormAppearanceProps) {
  const theme = useFormTheme();
  const { t } = useTranslation(["categories", "validation"]);
  const tr = asTranslate(t);

  function errorText(code: string | undefined): string | null {
    return code ? tr(`validation:categories.${code}`) : null;
  }

  return (
    <View>
      <ThemedText style={styles.label}>{t("form.type")}</ThemedText>
      <CategoryFormTypeSelector
        value={values.type}
        locked={typeLocked}
        disabled={disabled}
        onChange={(type) => onChange("type", type)}
      />
      {errorText(errors.type) ? (
        <ThemedText style={[styles.fieldError, { color: theme.danger }]}>
          {errorText(errors.type)}
        </ThemedText>
      ) : null}
      {typeLocked ? (
        <ThemedText style={[styles.helper, { color: theme.muted }]}>
          {t("form.typeLocked")}
        </ThemedText>
      ) : null}

      <ThemedText style={styles.label}>{t("form.icon")}</ThemedText>
      <CategoryFormIconSelector
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
      <CategoryFormColorSelector
        value={values.color}
        disabled={disabled}
        onChange={(color) => onChange("color", color)}
      />
      {errorText(errors.color) ? (
        <ThemedText style={[styles.fieldError, { color: theme.danger }]}>
          {errorText(errors.color)}
        </ThemedText>
      ) : null}
    </View>
  );
}
