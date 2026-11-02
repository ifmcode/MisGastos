import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Modal, Platform, Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
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
          accessibilityLabel="Cerrar calendario"
          onPress={onClose}
          style={styles.backdrop}
        />
        <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancelar"
              hitSlop={8}
              onPress={onClose}
              style={styles.action}
            >
              <ThemedText style={{ color: theme.muted }}>Cancelar</ThemedText>
            </Pressable>
            <ThemedText type="defaultSemiBold">Seleccionar fecha</ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Confirmar fecha"
              hitSlop={8}
              onPress={confirm}
              style={styles.action}
            >
              <ThemedText style={{ color: theme.primary }}>Listo</ThemedText>
            </Pressable>
          </View>
          <DateTimePicker
            value={draftDate}
            mode="date"
            display="spinner"
            locale="es-ES"
            themeVariant={theme.isDark ? "dark" : "light"}
            onChange={handleChange}
          />
        </View>
      </View>
    </Modal>
  );
}
