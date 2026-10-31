import { StyleSheet } from "react-native";

/** Shared tokens so components never repeat raw color values. */
export const dashboardPalette = {
  primary: "#0A7EA4",
  primarySoft: "rgba(10, 126, 164, 0.06)",
  primarySoftStrong: "rgba(10, 126, 164, 0.08)",
  primarySoftIcon: "rgba(10, 126, 164, 0.12)",
  primaryBorder: "rgba(10, 126, 164, 0.25)",
  onPrimary: "#FFFFFF",
  danger: "#C62828",
  dangerSurface: "#FDECEA",
  dangerText: "#8A1C1C",
} as const;

export const dashboardStyles = StyleSheet.create({
  // Layout
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
  headerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: dashboardPalette.primary,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  headerButtonText: {
    color: dashboardPalette.onPrimary,
    fontSize: 14,
    fontWeight: "700",
  },

  // Wallet filters
  filterRow: {
    gap: 8,
    paddingBottom: 16,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    maxWidth: 180,
  },
  filterChipSelected: {
    backgroundColor: dashboardPalette.primary,
    borderColor: dashboardPalette.primary,
  },
  filterChipIdle: {
    backgroundColor: dashboardPalette.primarySoftStrong,
    borderColor: dashboardPalette.primaryBorder,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: dashboardPalette.primary,
  },
  filterChipTextSelected: {
    fontSize: 14,
    fontWeight: "600",
    color: dashboardPalette.onPrimary,
  },

  // Section headers
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 19,
  },
  sectionCount: {
    fontSize: 13,
    opacity: 0.65,
  },

  // Footer / recent transfers
  footer: {
    marginTop: 24,
  },
  transferList: {
    gap: 10,
  },
  transferEmptyCard: {
    borderWidth: 1,
    borderColor: dashboardPalette.primaryBorder,
    borderRadius: 16,
    padding: 16,
    backgroundColor: dashboardPalette.primarySoft,
  },
  transferEmptyText: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.7,
    marginTop: 4,
  },
  inlineLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  inlineLoadingText: {
    fontSize: 13,
    opacity: 0.7,
  },
  inlineError: {
    borderRadius: 12,
    backgroundColor: dashboardPalette.dangerSurface,
    padding: 12,
    gap: 6,
  },
  inlineErrorText: {
    color: dashboardPalette.dangerText,
    fontSize: 13,
    lineHeight: 18,
  },
  inlineRetryText: {
    color: dashboardPalette.danger,
    fontSize: 13,
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
    backgroundColor: dashboardPalette.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  retryButtonText: {
    color: dashboardPalette.onPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 40,
  },
  emptyIcon: {
    width: 74,
    height: 74,
    borderRadius: 24,
    backgroundColor: dashboardPalette.primarySoftIcon,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 19,
    textAlign: "center",
  },
});
