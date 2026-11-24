import { StyleSheet } from "react-native";

import { absoluteFill } from "@/shared/styles/absolute-fill";

/**
 * Layout of the group-expense section, form and detail. Every colour comes from
 * `useFormTheme`; only the picker backdrop needs a raw translucent value.
 */
export const groupExpensesPalette = {
  backdrop: "rgba(17, 24, 28, 0.5)",
} as const;

export const groupExpensesStyles = StyleSheet.create({
  // Interaction states
  pressed: {
    opacity: 0.7,
  },
  actionDisabled: {
    opacity: 0.5,
  },

  // Section and list
  section: {
    gap: 10,
  },
  sectionTitle: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },

  // Form shell
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 18,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 48,
    fontSize: 16,
  },
  helper: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  fieldError: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },

  // Group field and picker
  groupField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  groupFieldText: {
    flexShrink: 1,
    fontSize: 16,
  },
  overlay: {
    ...absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    zIndex: 30,
  },
  backdrop: {
    ...absoluteFill,
    backgroundColor: groupExpensesPalette.backdrop,
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
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerList: {
    flexShrink: 1,
    maxHeight: 380,
  },
  pickerListContent: {
    gap: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 44,
  },
  optionMeta: {
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  pickerOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },

  // Participant multi-select
  participantList: {
    gap: 8,
    marginTop: 10,
  },
  participantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 48,
  },
  participantBody: {
    flex: 1,
    gap: 2,
  },
  participantName: {
    flexShrink: 1,
    fontSize: 15,
  },
  participantMeta: {
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  // Payer and split chips
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    minHeight: 44,
    maxWidth: "100%",
  },
  chipText: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  optionChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 44,
  },
  optionChipDisabled: {
    opacity: 0.6,
  },
  splitRows: {
    gap: 8,
    marginTop: 10,
  },
  splitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  splitName: {
    flex: 1,
    fontSize: 15,
  },
  splitInput: {
    minWidth: 80,
    paddingVertical: 8,
    fontSize: 16,
    textAlign: "right",
  },
  splitSuffix: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Detail
  detailSection: {
    gap: 10,
  },
  detailSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  notice: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  noticeText: {
    fontSize: 13,
    lineHeight: 19,
  },
});
