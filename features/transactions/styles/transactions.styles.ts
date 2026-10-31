import { StyleSheet } from "react-native";

/** Shared tokens so components never repeat raw color values. */
export const transactionsPalette = {
  primary: "#0A7EA4",
  primarySoft: "rgba(10, 126, 164, 0.12)",
  primaryBorder: "rgba(10, 126, 164, 0.4)",
  onPrimary: "#FFFFFF",
  danger: "#C62828",
} as const;

export const transactionsStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  separator: {
    height: 10,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 18,
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.65,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: transactionsPalette.primarySoft,
  },
  filterDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: transactionsPalette.primary,
  },
  headerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: transactionsPalette.primary,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  headerButtonText: {
    color: transactionsPalette.onPrimary,
    fontSize: 14,
    fontWeight: "700",
  },

  // Feedback states
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  centeredText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.7,
    textAlign: "center",
    marginTop: 8,
  },
  errorTitle: {
    marginTop: 14,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 18,
    backgroundColor: transactionsPalette.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  retryButtonText: {
    color: transactionsPalette.onPrimary,
    fontSize: 15,
    fontWeight: "700",
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 40,
  },
  emptyIcon: {
    width: 74,
    height: 74,
    borderRadius: 24,
    backgroundColor: transactionsPalette.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 19,
    textAlign: "center",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: transactionsPalette.primary,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginTop: 20,
  },
  createButtonText: {
    color: transactionsPalette.onPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryEmptyButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: transactionsPalette.primaryBorder,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginTop: 20,
  },
  secondaryEmptyButtonText: {
    color: transactionsPalette.primary,
    fontSize: 15,
    fontWeight: "700",
  },

  // Active filters summary
  activeFiltersRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  activeFiltersText: {
    fontSize: 13,
    opacity: 0.7,
  },
  clearFiltersText: {
    fontSize: 13,
    fontWeight: "600",
    color: transactionsPalette.primary,
  },

  // Floating action button
  fab: {
    position: "absolute",
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: transactionsPalette.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});
