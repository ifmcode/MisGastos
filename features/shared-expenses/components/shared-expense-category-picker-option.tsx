import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { linkedMovementStyles as styles } from "../styles/shared-expense-linked-movement.styles";
import type { SharedExpenseLinkScope } from "../types/shared-expense-link.types";
import {
  getSharedExpenseCategoryLabel,
  type SharedExpenseCategoryOption,
} from "../utils/shared-expense-link-options";

export interface SharedExpenseCategoryPickerOptionProps {
  option: SharedExpenseCategoryOption;
  selected: boolean;
  disabled: boolean;
  /** Copy namespace; the 1:1 form is the default, groups pass their own. */
  scope?: SharedExpenseLinkScope;
  onSelect: (categoryId: string) => void;
}

/** One selectable row inside the full linked-movement category popup; both forms. */
export function SharedExpenseCategoryPickerOption({
  option,
  selected,
  disabled,
  scope = "sharedExpenses",
  onSelect,
}: SharedExpenseCategoryPickerOptionProps) {
  const theme = useFormTheme();
  const { t, tr } = useScopedTranslation(scope);
  const label = getSharedExpenseCategoryLabel(option, tr);

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={t("form.categoryChipAccessibility", { name: label })}
      onPress={() => onSelect(option.id)}
      disabled={disabled}
      style={({ pressed }) => [
        styles.pickerOption,
        {
          backgroundColor: selected ? theme.primarySoft : theme.surface,
          borderColor: selected ? theme.primary : theme.border,
        },
        pressed && styles.pickerOptionPressed,
      ]}
    >
      <Ionicons
        name={option.icon}
        size={20}
        color={selected ? theme.primary : theme.muted}
        accessible={false}
      />
      <ThemedText
        style={[
          styles.pickerOptionText,
          { color: selected ? theme.primary : theme.text },
        ]}
        numberOfLines={1}
      >
        {label}
      </ThemedText>
      {selected ? (
        <Ionicons
          name="checkmark"
          size={18}
          color={theme.primary}
          accessible={false}
        />
      ) : null}
    </Pressable>
  );
}
