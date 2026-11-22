import { StyleSheet } from "react-native";

export const dateQuickSelectorStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  quickRow: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  chipDate: {
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  calendarButton: {
    width: 48,
    height: 48,
    flexShrink: 0,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldError: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  helper: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  disabled: {
    opacity: 0.6,
  },
});
