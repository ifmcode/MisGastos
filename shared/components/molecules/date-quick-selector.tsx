import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AccessibilityInfo, Platform, Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useLastUsedDate } from "@/shared/hooks/use-last-used-date";
import { formatDateInput } from "@/shared/utils/date";
import { getDateFieldSummary } from "@/shared/utils/date-field-summary";
import {
  getDateQuickOptions,
  getLastUsedDateOption,
} from "@/shared/utils/date-quick-options";

import { DATE_PICKER_SUPPORTED, DatePickerModal } from "./date-picker-modal";
import { DateQuickChip } from "./date-quick-chip";
import { dateQuickSelectorStyles as styles } from "./date-quick-selector.styles";

export interface DateQuickSelectorProps {
  valueIso: string;
  error?: string;
  disabled?: boolean;
  showLastUsedDate?: boolean;
  accessibilityLabel: string;
  onSelectDate: (isoDate: string) => void;
}

export function DateQuickSelector({
  valueIso,
  error,
  disabled = false,
  showLastUsedDate = false,
  accessibilityLabel,
  onSelectDate,
}: DateQuickSelectorProps) {
  const theme = useFormTheme();
  const { t } = useTranslation("common");
  const [pickerVisible, setPickerVisible] = useState(false);
  const mountedRef = useRef(false);
  const lastUsedDate = useLastUsedDate();
  const quickOptions = getDateQuickOptions();
  const lastOption = showLastUsedDate
    ? getLastUsedDateOption(lastUsedDate)
    : null;
  const options = lastOption
    ? [lastOption, quickOptions.today, quickOptions.yesterday]
    : [quickOptions.today, quickOptions.yesterday];

  const summary = getDateFieldSummary({
    valueIso,
    todayIso: quickOptions.today.isoDate,
    lastUsedIso: lastUsedDate,
  });
  const summaryText =
    summary === "selected"
      ? t("date.selected", { date: formatDateInput(valueIso) })
      : t("date.hint");
  const slotText = error ?? summaryText;

  // `accessibilityLiveRegion` only reaches Android; iOS needs an explicit
  // queued announcement. The mount text is skipped so opening the form is not
  // interrupted.
  useEffect(() => {
    const firstRender = !mountedRef.current;
    mountedRef.current = true;

    if (firstRender || Platform.OS !== "ios") return;

    AccessibilityInfo.announceForAccessibilityWithOptions(slotText, {
      queue: true,
    });
  }, [slotText]);

  function selectDate(isoDate: string) {
    setPickerVisible(false);
    onSelectDate(isoDate);
  }

  return (
    <View>
      <View style={styles.row}>
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
        </View>
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

      <ThemedText
        accessibilityLiveRegion="polite"
        style={[
          error ? styles.fieldError : styles.helper,
          { color: error ? theme.danger : theme.muted },
        ]}
      >
        {slotText}
      </ThemedText>

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
