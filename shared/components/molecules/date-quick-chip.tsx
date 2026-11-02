import { Pressable } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { DateQuickOption } from "@/shared/utils/date-quick-options";

import { dateQuickSelectorStyles as styles } from "./date-quick-selector.styles";

export interface DateQuickChipProps {
  option: DateQuickOption;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}

export function DateQuickChip({
  option,
  selected,
  disabled,
  onPress,
}: DateQuickChipProps) {
  const theme = useFormTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${option.label} ${option.displayDate}`}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      hitSlop={4}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.primarySoft : theme.surface,
          borderColor: selected ? theme.primary : theme.border,
        },
        disabled && styles.disabled,
      ]}
    >
      <ThemedText
        style={[
          styles.chipLabel,
          { color: selected ? theme.primary : theme.text },
        ]}
      >
        {option.label}
      </ThemedText>
      <ThemedText
        style={[
          styles.chipDate,
          { color: selected ? theme.primary : theme.muted },
        ]}
      >
        {option.displayDate}
      </ThemedText>
    </Pressable>
  );
}
