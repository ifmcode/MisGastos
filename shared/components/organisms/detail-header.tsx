import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import type {
  DetailActionLabels,
  DetailCloseIcon,
} from "@/shared/types/detail.types";

import { detailStyles as styles } from "./detail.styles";

export interface DetailHeaderProps {
  title: string;
  subtitle: string;
  disabled: boolean;
  labels: DetailActionLabels;
  /** Route details share the header with the modal but keep a back arrow. */
  closeIcon?: DetailCloseIcon;
  /** The close affordance always stays; each action can be hidden on its own. */
  showEdit?: boolean;
  showDelete?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function DetailHeader({
  title,
  subtitle,
  disabled,
  labels,
  closeIcon = "close",
  showEdit = true,
  showDelete = true,
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
        accessibilityHint={labels.closeHint}
        hitSlop={10}
        onPress={onClose}
        disabled={disabled}
        style={styles.closeButton}
      >
        <Ionicons
          name={closeIcon === "back" ? "chevron-back" : "close"}
          size={24}
          color={theme.muted}
        />
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
        {showEdit ? (
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
        ) : null}

        {showDelete ? (
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
        ) : null}
      </View>
    </View>
  );
}
