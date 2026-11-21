import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { groupExpensesStyles as styles } from "../styles/group-expenses.styles";

export interface GroupExpenseParticipantRowProps {
  name: string;
  /** Secondary line (the member email); omitted when it repeats the name. */
  meta?: string;
  selected: boolean;
  disabled: boolean;
  accessibilityLabel: string;
  accessibilityHint: string;
  onToggle: () => void;
}

/** Checkbox row of the group-expense participant multi-select. */
export function GroupExpenseParticipantRow({
  name,
  meta,
  selected,
  disabled,
  accessibilityLabel,
  accessibilityHint,
  onToggle,
}: GroupExpenseParticipantRowProps) {
  const theme = useFormTheme();

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled }}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      onPress={onToggle}
      style={({ pressed }) => [
        styles.participantRow,
        {
          borderColor: selected ? theme.primary : theme.border,
          backgroundColor: selected ? theme.primarySoft : theme.surface,
        },
        disabled && styles.actionDisabled,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.participantBody}>
        <ThemedText
          type="defaultSemiBold"
          style={styles.participantName}
          numberOfLines={1}
        >
          {name}
        </ThemedText>
        {meta ? (
          <ThemedText
            style={[styles.participantMeta, { color: theme.muted }]}
            numberOfLines={1}
          >
            {meta}
          </ThemedText>
        ) : null}
      </View>

      <View
        style={[
          styles.checkbox,
          {
            borderColor: selected ? theme.primary : theme.border,
            backgroundColor: selected ? theme.primary : theme.surface,
          },
        ]}
      >
        {selected ? (
          <Ionicons
            name="checkmark"
            size={16}
            color={theme.onPrimary}
            accessible={false}
          />
        ) : null}
      </View>
    </Pressable>
  );
}
