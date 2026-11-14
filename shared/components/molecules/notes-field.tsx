import { TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { formFieldStyles as styles } from "./form-field.styles";

export interface NotesFieldProps {
  /** Already translated copy. */
  label: string;
  value: string;
  placeholder: string;
  accessibilityLabel: string;
  maxLength: number;
  errorText?: string | null;
  disabled: boolean;
  onChange: (value: string) => void;
}

/** Multiline notes input with an error slot and a character counter. */
export function NotesField({
  label,
  value,
  placeholder,
  accessibilityLabel,
  maxLength,
  errorText,
  disabled,
  onChange,
}: NotesFieldProps) {
  const theme = useFormTheme();

  return (
    <>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={theme.muted}
        maxLength={maxLength}
        editable={!disabled}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        accessibilityLabel={accessibilityLabel}
        style={[
          styles.input,
          styles.textArea,
          {
            backgroundColor: theme.surface,
            borderColor: errorText ? theme.danger : theme.border,
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
          {value.length}/{maxLength}
        </ThemedText>
      </View>
    </>
  );
}
