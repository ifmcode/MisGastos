import { StyleSheet } from "react-native";

/**
 * Layout of one timeline row: date gutter, icon tile, text body and the
 * optional right amount. Colours always come from `useFormTheme`.
 */
export const timelineRowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    minHeight: 56,
  },
  gutter: {
    width: 32,
    alignItems: "center",
  },
  gutterMonth: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  gutterDay: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
  },
  amountColumn: {
    alignItems: "flex-end",
    maxWidth: 120,
  },
  amountText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    textAlign: "right",
  },
  pressed: {
    opacity: 0.7,
  },
});
