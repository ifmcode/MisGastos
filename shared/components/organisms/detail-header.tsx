import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import type { DetailActionLabels } from "@/shared/types/detail.types";

import { detailStyles as styles } from "./detail.styles";

export interface DetailHeaderProps {
  title: string;
  subtitle: string;
  disabled: boolean;
  labels: DetailActionLabels;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function DetailHeader({
  title,
  subtitle,
  disabled,
  labels,
  onEdit,
  onDelete,
  onClose,
}: DetailHeaderProps) {
  const theme = useFormTheme();

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={labels.close}
        hitSlop={10}
        onPress={onClose}
        disabled={disabled}
        style={styles.closeButton}
      >
        <Ionicons name="close" size={24} color={theme.muted} />
      </Pressable>

      <View style={styles.headerText}>
        <ThemedText type="title" style={styles.title}>
          {title}
        </ThemedText>
        <ThemedText
          style={[styles.subtitle, { color: theme.muted }]}
          numberOfLines={1}
        >
          {subtitle}
        </ThemedText>
      </View>

      <View style={styles.headerActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={labels.edit}
          accessibilityHint={labels.editHint}
          hitSlop={6}
          onPress={onEdit}
          disabled={disabled}
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: theme.primarySoft },
            pressed && styles.pressed,
            disabled && styles.disabled,
          ]}
        >
          <Ionicons name="pencil-outline" size={20} color={theme.primary} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={labels.delete}
          accessibilityHint={labels.deleteHint}
          hitSlop={6}
          onPress={onDelete}
          disabled={disabled}
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: theme.dangerSurface },
            pressed && styles.pressed,
            disabled && styles.disabled,
          ]}
        >
          <Ionicons name="trash-outline" size={20} color={theme.danger} />
        </Pressable>
      </View>
    </View>
  );
}
