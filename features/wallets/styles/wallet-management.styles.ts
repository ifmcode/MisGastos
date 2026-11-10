import { StyleSheet } from "react-native";

export const walletManagementPalette = {
  primary: "#0A7EA4",
  onPrimary: "#FFFFFF",
  danger: "#C62828",
  dangerSurface: "#FDECEA",
  dangerText: "#8A1C1C",
  overlay: "rgba(0, 0, 0, 0.45)",
} as const;

export const walletManagementStyles = StyleSheet.create({
  // Actions sheet
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: walletManagementPalette.overlay,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 36,
    gap: 10,
  },
  sheetTitle: {
    fontSize: 22,
    lineHeight: 28,
  },
  sheetSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  cancelButton: {
    marginTop: 6,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
  },

  // Delete modal
  deleteSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 36,
    gap: 12,
  },
  deleteMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  option: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  optionGroup: {
    gap: 8,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: walletManagementPalette.primary,
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  optionHint: {
    fontSize: 13,
    lineHeight: 18,
  },
  targetList: {
    gap: 8,
    marginTop: 4,
  },
  targetScroll: {
    maxHeight: 200,
  },
  targetChip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  targetText: {
    fontSize: 14,
    fontWeight: "600",
  },
  errorBanner: {
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  dangerButton: {
    flex: 1.4,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: walletManagementPalette.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  dangerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dangerButtonText: {
    color: walletManagementPalette.onPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.6,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },

  // Archived section
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 28,
    marginBottom: 10,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: "600",
  },
  sectionHint: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  sectionList: {
    gap: 10,
  },
});
