import { StyleSheet } from "react-native";

import { absoluteFill } from "@/shared/styles/absolute-fill";

/** Fixed colors that do not depend on the active theme. */
export const transactionFormPalette = {
  backdrop: "rgba(17, 24, 28, 0.5)",
} as const;

export const transactionFormStyles = StyleSheet.create({
  // Layout
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
  },

  // Type and info
  typeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  typeButton: {
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
  },
  typeButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  infoBanner: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },

  // Category chips
  categoryChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "600",
  },
  categoryAddItem: {
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
    backgroundColor: transactionFormPalette.backdrop,
  },
  pickerCard: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "80%",
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    gap: 12,
    boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.25)",
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
  pickerCreateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 48,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  pickerCreateText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
