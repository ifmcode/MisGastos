import { StyleSheet } from "react-native";

import { absoluteFill } from "@/shared/styles/absolute-fill";

import { sharedExpensesPalette } from "./shared-expenses.styles";

/** Wallet and category block of the linked movement. */
export const linkedMovementStyles = StyleSheet.create({
  section: {
    gap: 8,
  },

  // Wallet chips (mandatory while the viewer pays)
  group: {
    gap: 8,
  },
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

  // Category picker popup
  pickerOverlay: {
    ...absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    zIndex: 30,
  },
  pickerBackdrop: {
    ...absoluteFill,
    backgroundColor: sharedExpensesPalette.backdrop,
  },
  pickerCard: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "80%",
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  pickerTitle: {
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
  },
  pickerCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerList: {
    flexShrink: 1,
    maxHeight: 360,
  },
  pickerListContent: {
    gap: 8,
  },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pickerOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  pickerOptionPressed: {
    opacity: 0.7,
  },
});
