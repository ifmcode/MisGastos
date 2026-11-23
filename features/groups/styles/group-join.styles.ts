import { StyleSheet } from "react-native";

/**
 * Layout only: every colour comes from `useFormTheme`, so light and dark mode
 * share the same composition and no raw value is needed here.
 */
export const groupJoinStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 20,
  },

  // Interaction states shared by the join actions
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  // Join code card of the group detail
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  code: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    letterSpacing: 2,
  },
  helper: {
    fontSize: 13,
    lineHeight: 18,
  },

  // Join route: code form and result cards
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 48,
    fontSize: 18,
    letterSpacing: 2,
  },
  fieldError: {
    fontSize: 13,
    lineHeight: 18,
  },
  resultTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  resultMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
});
