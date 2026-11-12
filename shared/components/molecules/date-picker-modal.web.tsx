import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { getTodayIsoDate } from "@/shared/utils/date";
import {
  calendarMonthFromIso,
  shiftCalendarMonth,
} from "@/shared/utils/date-calendar";

import { DatePickerCalendar } from "./date-picker-calendar";
import { datePickerCalendarStyles as styles } from "./date-picker-calendar.styles";
import type { DatePickerModalProps } from "./date-picker-modal.types";

export const DATE_PICKER_SUPPORTED = true;

export function DatePickerModal({
  visible,
  valueIso,
  onClose,
  onSelect,
}: DatePickerModalProps) {
  const theme = useFormTheme();
  const { t } = useTranslation("common");
  const todayIso = getTodayIsoDate();
  const [month, setMonth] = useState(() => calendarMonthFromIso(valueIso));

  if (!visible) return null;

  function selectDay(isoDate: string) {
    onSelect(isoDate);
    onClose();
  }

  function goToPreviousMonth() {
    setMonth((current) =>
      shiftCalendarMonth(current.year, current.month, -1),
    );
  }

  function goToNextMonth() {
    setMonth((current) => shiftCalendarMonth(current.year, current.month, 1));
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("accessibility.closeCalendar")}
          onPress={onClose}
          style={styles.backdrop}
        />
        <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("accessibility.cancel")}
              hitSlop={8}
              onPress={onClose}
              style={styles.action}
            >
              <ThemedText style={{ color: theme.muted }}>
                {t("actions.cancel")}
              </ThemedText>
            </Pressable>
            <ThemedText type="defaultSemiBold">
              {t("date.selectDate")}
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("date.selectToday")}
              hitSlop={8}
              onPress={() => selectDay(todayIso)}
              style={styles.action}
            >
              <ThemedText style={{ color: theme.primary }}>
                {t("date.today")}
              </ThemedText>
            </Pressable>
          </View>

          <DatePickerCalendar
            valueIso={valueIso}
            month={month}
            onPreviousMonth={goToPreviousMonth}
            onNextMonth={goToNextMonth}
            onSelectDate={selectDay}
          />
        </View>
      </View>
    </Modal>
  );
}
