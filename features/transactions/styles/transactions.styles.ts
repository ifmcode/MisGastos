import { StyleSheet } from "react-native";

/** Shared tokens so components never repeat raw color values. */
export const transactionsPalette = {
  primary: "#0A7EA4",
  primarySoft: "rgba(10, 126, 164, 0.12)",
  onPrimary: "#FFFFFF",
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
});
