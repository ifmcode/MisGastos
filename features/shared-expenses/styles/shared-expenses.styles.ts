import { StyleSheet } from "react-native";

import { absoluteFill } from "@/shared/styles/absolute-fill";

/** Palette tokens of the section: only the picker backdrop needs a raw value. */
export const sharedExpensesPalette = {
  backdrop: "rgba(17, 24, 28, 0.5)",
} as const;

export const sharedExpensesStyles = StyleSheet.create({
  // Expense list
  list: {
    gap: 10,
  },

  // Expense row
  rowCard: {
    flexDirection: "row",
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  rowAmount: {
    fontSize: 16,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  rowLine: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  actionDisabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.7,
  },

  // Form shell
  flex: {
    flex: 1,
  },
  container: {
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

  // Friend field
  selectedFriend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  selectedFriendText: {
    flexShrink: 1,
    fontSize: 16,
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
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  // Option chips mirror the shared date quick chips (rounded rect, soft fill).
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
  participantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  participantName: {
    flex: 1,
    fontSize: 15,
  },
  participantInput: {
    minWidth: 80,
    paddingVertical: 8,
    fontSize: 16,
    textAlign: "right",
  },
  participantSuffix: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Friend picker dialog
  overlay: {
    ...absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    zIndex: 30,
  },
  backdrop: {
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
});
