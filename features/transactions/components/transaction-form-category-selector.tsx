import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { transactionFormStyles as styles } from "../styles/transaction-form.styles";
import { TransactionCategory } from "../utils/transaction-options";

export interface TransactionFormCategorySelectorProps {
  categories: readonly TransactionCategory[];
  value: string;
  error?: string;
  disabled: boolean;
  onChange: (categoryId: string) => void;
  onCreate?: () => void;
}

export function TransactionFormCategorySelector({
  categories,
  value,
  error,
  disabled,
  onChange,
  onCreate,
}: TransactionFormCategorySelectorProps) {
  const theme = useFormTheme();

  return (
    <View>
      <ThemedText style={styles.label}>Categoría</ThemedText>
      <View style={styles.categoryGrid}>
        {categories.map((category) => {
          const selected = value === category.id;

          return (
            <Pressable
              key={category.id}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={category.label}
              onPress={() => onChange(category.id)}
              disabled={disabled}
              style={[
                styles.categoryItem,
                {
                  backgroundColor: selected
                    ? theme.primarySoft
                    : theme.surface,
                  borderColor: selected ? theme.primary : theme.border,
                },
              ]}
            >
              <Ionicons
                name={category.icon}
                size={20}
                color={selected ? theme.primary : theme.muted}
              />
              <ThemedText
                style={[
                  styles.categoryText,
                  { color: selected ? theme.primary : theme.text },
                ]}
                numberOfLines={1}
              >
                {category.label}
              </ThemedText>
            </Pressable>
          );
        })}

        {onCreate ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Crear categoría"
            onPress={onCreate}
            disabled={disabled}
            style={[
              styles.categoryItem,
              styles.categoryAddItem,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Ionicons name="add" size={20} color={theme.primary} />
            <ThemedText
              style={[styles.categoryText, { color: theme.primary }]}
            >
              Nueva
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
      {categories.length === 0 && !onCreate ? (
        <ThemedText style={[styles.helper, { color: theme.muted }]}>
          No hay categorías para este tipo.
        </ThemedText>
      ) : null}
      {error ? (
        <ThemedText style={[styles.fieldError, { color: theme.danger }]}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}
