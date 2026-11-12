import { StyleSheet } from "react-native";

/** Shared tokens so components never repeat raw color values. */
export const categoriesPalette = {
  primary: "#0A7EA4",
  primarySoftStrong: "rgba(10, 126, 164, 0.08)",
  primarySoftIcon: "rgba(10, 126, 164, 0.12)",
  primaryBorder: "rgba(10, 126, 164, 0.25)",
  onPrimary: "#FFFFFF",
  danger: "#C62828",
} as const;

export const categoriesStyles = StyleSheet.create({
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
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
  headerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: categoriesPalette.primary,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  headerButtonText: {
    color: categoriesPalette.onPrimary,
    fontSize: 14,
    fontWeight: "700",
  },

  // Type filters
  filterArea: {
    flex: 1,
  },
  listHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 16,
  },
  filterRow: {
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  filterChipSelected: {
    backgroundColor: categoriesPalette.primary,
    borderColor: categoriesPalette.primary,
  },
  filterChipIdle: {
    backgroundColor: categoriesPalette.primarySoftStrong,
    borderColor: categoriesPalette.primaryBorder,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: categoriesPalette.primary,
  },
  filterChipTextSelected: {
    fontSize: 14,
    fontWeight: "600",
    color: categoriesPalette.onPrimary,
  },

  // Card
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardDetails: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },
  cardMeta: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.65,
    marginTop: 2,
  },

  // Reordering
  reorderToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderColor: categoriesPalette.primaryBorder,
    backgroundColor: categoriesPalette.primarySoftStrong,
  },
  reorderToggleActive: {
    backgroundColor: categoriesPalette.primary,
    borderColor: categoriesPalette.primary,
  },
  reorderToggleDisabled: {
    opacity: 0.5,
  },
  reorderToggleText: {
    fontSize: 13,
    fontWeight: "700",
    color: categoriesPalette.primary,
  },
  reorderToggleTextActive: {
    color: categoriesPalette.onPrimary,
  },
  reorderHint: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.65,
    marginTop: -8,
    marginBottom: 14,
  },
  reorderError: {
    fontSize: 13,
    lineHeight: 18,
    color: categoriesPalette.danger,
    marginTop: -8,
    marginBottom: 14,
  },
  reorderActions: {
    flexDirection: "row",
    gap: 8,
  },
  reorderButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: categoriesPalette.primaryBorder,
    backgroundColor: categoriesPalette.primarySoftStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  reorderButtonDisabled: {
    opacity: 0.35,
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
    backgroundColor: categoriesPalette.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  retryButtonText: {
    color: categoriesPalette.onPrimary,
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
    backgroundColor: categoriesPalette.primarySoftIcon,
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
    backgroundColor: categoriesPalette.primary,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginTop: 20,
  },
  createButtonText: {
    color: categoriesPalette.onPrimary,
    fontSize: 15,
    fontWeight: "700",
  },

  // Floating action button
  fab: {
    position: "absolute",
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: categoriesPalette.primary,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
  },
});
