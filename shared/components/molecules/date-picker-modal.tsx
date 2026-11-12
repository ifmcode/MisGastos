import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Platform, Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import {
  parseIsoDateToLocalDate,
  toLocalIsoDate,
} from "@/shared/utils/date";

import { datePickerModalStyles as styles } from "./date-picker-modal.styles";
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
  const { locale } = useAppLocale();
  const [draftDate, setDraftDate] = useState<Date>(
    () => parseIsoDateToLocalDate(valueIso) ?? new Date(),
  );

  if (!visible) return null;

  function handleChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === "android") {
      onClose();

      if (event.type === "set") {
        const isoDate = date ? toLocalIsoDate(date) : null;
        if (isoDate) onSelect(isoDate);
      }

      return;
    }

    if (date) setDraftDate(date);
  }

  function confirm() {
    const isoDate = toLocalIsoDate(draftDate);
    if (isoDate) onSelect(isoDate);
    else onClose();
  }

  if (Platform.OS === "android") {
    return (
      <DateTimePicker
        value={draftDate}
        mode="date"
        display="default"
        onChange={handleChange}
      />
    );
  }

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
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
              accessibilityLabel={t("accessibility.confirmDate")}
              hitSlop={8}
              onPress={confirm}
              style={styles.action}
            >
              <ThemedText style={{ color: theme.primary }}>
                {t("actions.done")}
              </ThemedText>
            </Pressable>
          </View>
          <DateTimePicker
            value={draftDate}
            mode="date"
            display="spinner"
            locale={locale}
            themeVariant={theme.isDark ? "dark" : "light"}
            onChange={handleChange}
          />
        </View>
      </View>
    </Modal>
  );
}
