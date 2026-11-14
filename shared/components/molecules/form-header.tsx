import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { formHeaderStyles as styles } from "./form-header.styles";

export interface FormHeaderProps {
  /** Already translated title, subtitle and accessibility label. */
  title: string;
  subtitle: string;
  closeAccessibilityLabel: string;
  disabled?: boolean;
  onClose: () => void;
}

/** Title/subtitle plus close button shared by every page-sheet form. */
export function FormHeader({
  title,
  subtitle,
  closeAccessibilityLabel,
  disabled = false,
  onClose,
}: FormHeaderProps) {
  const theme = useFormTheme();

  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <ThemedText type="title" style={styles.title}>
          {title}
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.muted }]}>
          {subtitle}
        </ThemedText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={closeAccessibilityLabel}
        hitSlop={10}
        onPress={onClose}
        disabled={disabled}
        style={styles.closeButton}
      >
        <Ionicons name="close" size={24} color={theme.muted} />
      </Pressable>
    </View>
  );
}
