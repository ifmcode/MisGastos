import { useTranslation } from "react-i18next";
import { TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { formFieldStyles } from "@/shared/components/molecules/form-field.styles";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import {
  PROFILE_NAME_MAX_LENGTH,
  ProfileValidationCode,
} from "../schemas/profile.schema";

export interface ProfileNameFieldProps {
  value: string;
  error?: ProfileValidationCode;
  disabled: boolean;
  onChange: (value: string) => void;
}

export function ProfileNameField({
  value,
  error,
  disabled,
  onChange,
}: ProfileNameFieldProps) {
  const theme = useFormTheme();
  const { t } = useTranslation(["profile", "validation"]);

  const errorText = error
    ? t(`validation:profile.${error}`, { max: PROFILE_NAME_MAX_LENGTH })
    : null;

  return (
    <View>
      <ThemedText style={formFieldStyles.label}>{t("form.name")}</ThemedText>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={t("form.namePlaceholder")}
        placeholderTextColor={theme.muted}
        maxLength={PROFILE_NAME_MAX_LENGTH}
        editable={!disabled}
        accessibilityLabel={t("form.nameAccessibility")}
        style={[
          formFieldStyles.input,
          {
            backgroundColor: theme.surface,
            borderColor: error ? theme.danger : theme.border,
            color: theme.text,
          },
        ]}
      />
      {errorText ? (
        <ThemedText
          style={[formFieldStyles.fieldError, { color: theme.danger }]}
        >
          {errorText}
        </ThemedText>
      ) : (
        <ThemedText style={[formFieldStyles.helper, { color: theme.muted }]}>
          {t("form.nameHint")}
        </ThemedText>
      )}
    </View>
  );
}
