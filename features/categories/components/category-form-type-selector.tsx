import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { asTranslate } from "@/shared/i18n/translate";

import { categoryFormStyles as styles } from "../styles/category-form.styles";
import { CategoryType } from "../types/category.types";
import { CATEGORY_TYPE_OPTIONS } from "../utils/category-options";

export interface CategoryFormTypeSelectorProps {
  value: CategoryType;
  locked: boolean;
  disabled: boolean;
  onChange: (type: CategoryType) => void;
}

export function CategoryFormTypeSelector({
  value,
  locked,
  disabled,
  onChange,
}: CategoryFormTypeSelectorProps) {
  const theme = useFormTheme();
  const { t } = useTranslation("categories");
  const tr = asTranslate(t);

  return (
    <View style={styles.chipsWrap}>
      {CATEGORY_TYPE_OPTIONS.map((option) => {
        const selected = value === option.value;
        const label = tr(option.labelKey);

        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled: locked || disabled }}
            accessibilityLabel={t("form.typeAccessibility", { label })}
            onPress={() => onChange(option.value)}
            disabled={disabled || locked}
            style={[
              styles.typeChip,
              {
                backgroundColor: selected ? theme.primary : theme.surface,
                borderColor: selected ? theme.primary : theme.border,
              },
              (disabled || locked) && styles.disabled,
            ]}
          >
            <Ionicons
              name={option.icon}
              size={17}
              color={selected ? theme.onPrimary : theme.muted}
            />
            <ThemedText
              style={[
                styles.typeChipText,
                { color: selected ? theme.onPrimary : theme.text },
              ]}
            >
              {label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}
