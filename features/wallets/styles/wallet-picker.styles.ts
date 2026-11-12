import { StyleSheet } from "react-native";

import { absoluteFill } from "@/shared/styles/absolute-fill";

/** Shared tokens so the wallet picker never repeats raw color values. */
export const walletPickerPalette = {
  backdrop: "rgba(17, 24, 28, 0.5)",
} as const;

export const walletPickerStyles = StyleSheet.create({
  // Compact chips
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 44,
    maxWidth: "100%",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "600",
  },
  chipAdd: {
    borderStyle: "dashed",
  },

  // Feedback
  helper: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },

  // Picker popup
  overlay: {
    ...absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    zIndex: 30,
  },
  backdrop: {
    ...absoluteFill,
    backgroundColor: walletPickerPalette.backdrop,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "80%",
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    gap: 12,
    boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.25)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    flexShrink: 1,
    maxHeight: 380,
  },
  listContent: {
    gap: 8,
  },

  // Option row
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  optionPressed: {
    opacity: 0.7,
  },
  optionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: {
    flex: 1,
  },
  optionName: {
    fontSize: 15,
  },
  optionMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  optionAmounts: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  optionBalance: {
    fontSize: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
});
