import { StyleSheet } from "react-native";

/**
 * Layout of the group settlement form and rows. Colours always come from
 * `useFormTheme`; the section shell reuses `groupExpensesStyles` so the group
 * detail keeps one visual rhythm.
 */
export const groupSettlementsStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    gap: 16,
  },

  // Debt card
  debtCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  debtLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  debtGroup: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
  },
  debtPair: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
  },
  debtDirection: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    marginTop: 6,
  },

  // Debt step
  stepCaption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  stepList: {
    gap: 4,
  },
  stepEmpty: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Form notice
  formNotice: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  formNoticeText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
});
