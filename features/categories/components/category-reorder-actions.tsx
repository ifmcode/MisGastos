import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { categoriesStyles as styles } from "../styles/categories.styles";

export interface CategoryReorderActionsProps {
  categoryName: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  disabled: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function CategoryReorderActions({
  categoryName,
  canMoveUp,
  canMoveDown,
  disabled,
  onMoveUp,
  onMoveDown,
}: CategoryReorderActionsProps) {
  const theme = useFormTheme();

  return (
    <View style={styles.reorderActions}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Mover ${categoryName} hacia arriba`}
        accessibilityState={{ disabled: disabled || !canMoveUp }}
        disabled={disabled || !canMoveUp}
        onPress={onMoveUp}
        hitSlop={6}
        style={[
          styles.reorderButton,
          (disabled || !canMoveUp) && styles.reorderButtonDisabled,
        ]}
      >
        <Ionicons name="chevron-up" size={18} color={theme.text} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Mover ${categoryName} hacia abajo`}
        accessibilityState={{ disabled: disabled || !canMoveDown }}
        disabled={disabled || !canMoveDown}
        onPress={onMoveDown}
        hitSlop={6}
        style={[
          styles.reorderButton,
          (disabled || !canMoveDown) && styles.reorderButtonDisabled,
        ]}
      >
        <Ionicons name="chevron-down" size={18} color={theme.text} />
      </Pressable>
    </View>
  );
}
