import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { settlementsStyles as styles } from "../styles/settlements.styles";
import type { SettlementIncomeCategory } from "../utils/settlement-form-options";

export interface SettlementCategoryPickerOptionProps {
  option: SettlementIncomeCategory;
  selected: boolean;
  disabled: boolean;
  onSelect: (categoryId: string) => void;
}

/** One selectable row inside the settlement income category popup. */
export function SettlementCategoryPickerOption({
  option,
  selected,
  disabled,
  onSelect,
}: SettlementCategoryPickerOptionProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("settlements");
  const label = option.unavailable
    ? t("form.categoryUnavailable")
    : option.name;

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={t("form.categoryChipAccessibility", { name: label })}
      onPress={() => onSelect(option.id)}
      disabled={disabled}
      style={({ pressed }) => [
        styles.pickerOption,
        {
          backgroundColor: selected ? theme.primarySoft : theme.surface,
          borderColor: selected ? theme.primary : theme.border,
        },
        pressed && styles.pressed,
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
