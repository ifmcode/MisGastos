import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import {
  WEEKDAY_LABELS,
  buildCalendarMonth,
  type CalendarMonthRef,
} from "@/shared/utils/date-calendar";

import { datePickerCalendarStyles as styles } from "./date-picker-calendar.styles";

export interface DatePickerCalendarProps {
  valueIso: string;
  month: CalendarMonthRef;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (isoDate: string) => void;
}

export function DatePickerCalendar({
  valueIso,
  month,
  onPreviousMonth,
  onNextMonth,
  onSelectDate,
}: DatePickerCalendarProps) {
  const theme = useFormTheme();
  const calendar = buildCalendarMonth(month.year, month.month);

  return (
    <>
      <View style={styles.monthRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mes anterior"
          onPress={onPreviousMonth}
          style={styles.navButton}
        >
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.monthLabel}>{calendar.label}</ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mes siguiente"
          onPress={onNextMonth}
          style={styles.navButton}
        >
          <Ionicons name="chevron-forward" size={20} color={theme.text} />
        </Pressable>
      </View>

      <View style={styles.weekdaysRow}>
        {WEEKDAY_LABELS.map((label) => (
          <View key={label} style={styles.weekdayCell}>
            <ThemedText style={[styles.weekdayText, { color: theme.muted }]}>
              {label}
            </ThemedText>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {calendar.weeks.map((week, weekIndex) => (
          <View
            key={`${calendar.year}-${calendar.month}-${weekIndex}`}
            style={styles.weekRow}
          >
            {week.map((day, dayIndex) => {
              if (!day) {
                return (
                  <View key={`blank-${dayIndex}`} style={styles.dayCell} />
                );
              }

              const selected = day.isoDate === valueIso;

              return (
                <Pressable
                  key={day.isoDate}
                  accessibilityRole="button"
                  accessibilityLabel={`Día ${day.day} de ${calendar.label}`}
                  accessibilityState={{ selected }}
                  onPress={() => onSelectDate(day.isoDate)}
                  style={[
                    styles.dayCell,
                    {
                      backgroundColor: selected
                        ? theme.primarySoft
                        : "transparent",
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.dayText,
                      { color: selected ? theme.primary : theme.text },
                      selected && { fontWeight: "700" },
                    ]}
                  >
                    {day.day}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </>
  );
}
