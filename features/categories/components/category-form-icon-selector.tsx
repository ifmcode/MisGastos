import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { categoryFormStyles as styles } from "../styles/category-form.styles";
import { CATEGORY_ICONS } from "../utils/category-options";

export interface CategoryFormIconSelectorProps {
  value: string;
  disabled: boolean;
  onChange: (icon: string) => void;
}

export function CategoryFormIconSelector({
  value,
  disabled,
  onChange,
}: CategoryFormIconSelectorProps) {
  const theme = useFormTheme();

  return (
    <View style={styles.iconGrid}>
      {CATEGORY_ICONS.map((icon) => {
        const selected = value === icon;

        return (
          <Pressable
            key={icon}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`Icono ${icon}`}
            onPress={() => onChange(icon)}
            disabled={disabled}
            style={[
              styles.iconButton,
              {
                backgroundColor: selected ? theme.primary : theme.surface,
                borderColor: selected ? theme.primary : theme.border,
              },
            ]}
          >
            <Ionicons
              name={icon}
              size={22}
              color={selected ? theme.onPrimary : theme.muted}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
