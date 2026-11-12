import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { categoryFormStyles as styles } from "../styles/category-form.styles";
import { CATEGORY_COLORS } from "../utils/category-options";

export interface CategoryFormColorSelectorProps {
  value: string;
  disabled: boolean;
  onChange: (color: string) => void;
}

export function CategoryFormColorSelector({
  value,
  disabled,
  onChange,
}: CategoryFormColorSelectorProps) {
  const theme = useFormTheme();
  const { t } = useTranslation("categories");

  return (
    <View style={styles.colorRow}>
      {CATEGORY_COLORS.map((color) => {
        const selected = value === color;

        return (
          <Pressable
            key={color}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={t("form.colorAccessibility", { name: color })}
            onPress={() => onChange(color)}
            disabled={disabled}
            style={[
              styles.colorButton,
              { backgroundColor: color },
              selected && { borderColor: theme.text },
            ]}
          >
            {selected ? (
              <Ionicons name="checkmark" size={18} color={theme.onPrimary} />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
