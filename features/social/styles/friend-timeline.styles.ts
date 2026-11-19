import { StyleSheet } from "react-native";

/**
 * Layout only: every colour comes from `useFormTheme`, so light and dark mode
 * share the same composition.
 */
export const friendTimelineStyles = StyleSheet.create({
  // Section
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  list: {
    gap: 2,
  },

  // Row
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

  // Collapsed full settlement
  settledNotice: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  settledTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
  },
  settledMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  toggleButton: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },

  // Settled history separator
  separator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  separatorLine: {
    flex: 1,
    height: 1,
  },
  separatorLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
});
