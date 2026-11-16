import { StyleSheet } from "react-native";

/**
 * Layout only: every colour comes from `useFormTheme` so light and dark mode
 * share the same composition.
 */
export const friendsStyles = StyleSheet.create({
  // Search
  searchCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  searchHint: {
    fontSize: 13,
    lineHeight: 18,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 48,
    fontSize: 16,
  },
  fieldError: {
    fontSize: 13,
    lineHeight: 18,
  },
  searchActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },

  // Action button
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    minHeight: 44,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },

  // Search result and empty search state
  resultCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  resultMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  resultNote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  resultActions: {
    flexDirection: "row",
    marginTop: 8,
  },

  // Sections
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },

  // Request rows
  requestCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  rowBody: {
    gap: 2,
  },
  rowMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  rowActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  // Friend rows
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  friendBody: {
    flex: 1,
    gap: 2,
  },
  friendBalance: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  pressed: {
    opacity: 0.7,
  },
});
