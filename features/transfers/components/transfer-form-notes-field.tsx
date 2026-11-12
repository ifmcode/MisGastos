import { useTranslation } from "react-i18next";
import { TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import {
  TRANSFER_NOTES_MAX_LENGTH,
  type TransferValidationCode,
} from "../schemas/transfer.schema";
import { transferFormStyles as styles } from "../styles/transfer-form.styles";

export interface TransferFormNotesFieldProps {
  value: string;
  error?: TransferValidationCode;
  disabled: boolean;
  onChange: (value: string) => void;
}

export function TransferFormNotesField({
  value,
  error,
  disabled,
  onChange,
}: TransferFormNotesFieldProps) {
  const theme = useFormTheme();
  const { t } = useTranslation(["transfers", "validation"]);
  const errorText = error
    ? t(`validation:transfers.${error}`, {
        max: TRANSFER_NOTES_MAX_LENGTH,
      })
    : null;

  return (
    <>
      <ThemedText style={styles.label}>{t("form.notes")}</ThemedText>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={t("form.notesPlaceholder")}
        placeholderTextColor={theme.muted}
        maxLength={TRANSFER_NOTES_MAX_LENGTH}
        editable={!disabled}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        accessibilityLabel={t("form.notesAccessibility")}
        style={[
          styles.input,
          styles.textArea,
          {
            backgroundColor: theme.surface,
            borderColor: error ? theme.danger : theme.border,
            color: theme.text,
          },
        ]}
      />
      <View style={styles.descriptionFooter}>
        {errorText ? (
          <ThemedText style={[styles.fieldError, { color: theme.danger }]}>
            {errorText}
          </ThemedText>
        ) : (
          <View />
        )}
        <ThemedText style={[styles.counter, { color: theme.muted }]}>
          {value.length}/{TRANSFER_NOTES_MAX_LENGTH}
        </ThemedText>
      </View>
    </>
  );
}
