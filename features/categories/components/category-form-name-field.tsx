import { TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { CATEGORY_NAME_MAX_LENGTH } from "../schemas/category.schema";
import { categoryFormStyles as styles } from "../styles/category-form.styles";

export interface CategoryFormNameFieldProps {
  value: string;
  error?: string;
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

  return (
    <View>
      <ThemedText style={styles.label}>Nombre</ThemedText>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Ej. Restaurantes"
        placeholderTextColor={theme.muted}
        maxLength={CATEGORY_NAME_MAX_LENGTH}
        editable={!disabled}
        accessibilityLabel="Nombre de la categoría"
        style={[
          styles.input,
          {
            backgroundColor: theme.surface,
            borderColor: error ? theme.danger : theme.border,
            color: theme.text,
          },
        ]}
      />
      {error ? (
        <ThemedText style={styles.fieldError}>{error}</ThemedText>
      ) : null}
    </View>
  );
}
