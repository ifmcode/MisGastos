import { Pressable } from "react-native";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/themed-text";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
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
  const { t } = useTranslation("common");
  const locale = useAppLocale();
  const label = t(option.labelKey);
  const displayDate = locale.formatDate(option.isoDate, {
    day: "2-digit",
    month: "2-digit",
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} ${displayDate}`}
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
        {label}
      </ThemedText>
      <ThemedText
        style={[
          styles.chipDate,
          { color: selected ? theme.primary : theme.muted },
        ]}
      >
        {displayDate}
      </ThemedText>
    </Pressable>
  );
}
