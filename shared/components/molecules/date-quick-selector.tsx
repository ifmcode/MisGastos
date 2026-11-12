import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useLastUsedDate } from "@/shared/hooks/use-last-used-date";
import {
  getDateQuickOptions,
  getLastUsedDateOption,
} from "@/shared/utils/date-quick-options";

import { DATE_PICKER_SUPPORTED, DatePickerModal } from "./date-picker-modal";
import { DateQuickChip } from "./date-quick-chip";
import { dateQuickSelectorStyles as styles } from "./date-quick-selector.styles";

export interface DateQuickSelectorProps {
  text: string;
  valueIso: string;
  error?: string;
  disabled?: boolean;
  helperText?: string;
  showLastUsedDate?: boolean;
  accessibilityLabel: string;
  onChangeText: (text: string) => void;
  onSelectDate: (isoDate: string) => void;
}

export function DateQuickSelector({
  text,
  valueIso,
  error,
  disabled = false,
  helperText,
  showLastUsedDate = false,
  accessibilityLabel,
  onChangeText,
  onSelectDate,
}: DateQuickSelectorProps) {
  const theme = useFormTheme();
  const { t } = useTranslation("common");
  const [pickerVisible, setPickerVisible] = useState(false);
  const lastUsedDate = useLastUsedDate();
  const quickOptions = getDateQuickOptions();
  const lastOption = showLastUsedDate
    ? getLastUsedDateOption(lastUsedDate)
    : null;
  const options = lastOption
    ? [lastOption, quickOptions.today, quickOptions.yesterday]
    : [quickOptions.today, quickOptions.yesterday];

  function selectDate(isoDate: string) {
    setPickerVisible(false);
    onSelectDate(isoDate);
  }

  return (
    <View>
      <View style={styles.quickRow}>
        {options.map((option) => (
          <DateQuickChip
            key={option.key}
            option={option}
            selected={valueIso === option.isoDate}
            disabled={disabled}
            onPress={() => selectDate(option.isoDate)}
          />
        ))}
        {DATE_PICKER_SUPPORTED ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("date.openCalendar", {
              label: accessibilityLabel,
            })}
            accessibilityState={{ disabled }}
            disabled={disabled}
            hitSlop={4}
            onPress={() => setPickerVisible(true)}
            style={[
              styles.calendarButton,
              {
                backgroundColor: theme.surface,
                borderColor: error ? theme.danger : theme.border,
              },
              disabled && styles.disabled,
            ]}
          >
            <Ionicons
              name="calendar-outline"
              size={22}
              color={disabled ? theme.muted : theme.primary}
            />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={onChangeText}
          placeholder={t("date.placeholder")}
          placeholderTextColor={theme.muted}
          editable={!disabled}
          accessibilityLabel={accessibilityLabel}
          style={[
            styles.input,
            {
              backgroundColor: theme.surface,
              borderColor: error ? theme.danger : theme.border,
              color: theme.text,
            },
            disabled && styles.disabled,
          ]}
        />
      </View>

      {error ? (
        <ThemedText style={[styles.fieldError, { color: theme.danger }]}>
          {error}
        </ThemedText>
      ) : helperText ? (
        <ThemedText style={[styles.helper, { color: theme.muted }]}>
          {helperText}
        </ThemedText>
      ) : null}

      {pickerVisible ? (
        <DatePickerModal
          visible
          valueIso={valueIso}
          onClose={() => setPickerVisible(false)}
          onSelect={selectDate}
        />
      ) : null}
    </View>
  );
}
