import { StyleSheet } from "react-native";

import { absoluteFill } from "@/shared/styles/absolute-fill";

export const datePickerCalendarWebPalette = {
  backdrop: "rgba(0, 0, 0, 0.4)",
} as const;

export const datePickerCalendarStyles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...absoluteFill,
    backgroundColor: datePickerCalendarWebPalette.backdrop,
  },
  sheet: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  action: {
    minHeight: 44,
    justifyContent: "center",
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  navButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  weekdaysRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  weekdayCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 32,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: "600",
  },
  grid: {
    paddingHorizontal: 16,
    gap: 4,
  },
  weekRow: {
    flexDirection: "row",
    gap: 4,
  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
    borderRadius: 12,
  },
  dayText: {
    fontSize: 15,
    fontVariant: ["tabular-nums"],
  },
});
