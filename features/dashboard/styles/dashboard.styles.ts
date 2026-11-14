import { StyleSheet } from "react-native";

/** Shared tokens so components never repeat raw color values. */
export const dashboardPalette = {
  primary: "#0A7EA4",
  primarySoftStrong: "rgba(10, 126, 164, 0.08)",
  primaryBorder: "rgba(10, 126, 164, 0.25)",
  onPrimary: "#FFFFFF",
} as const;

export const dashboardStyles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
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
  sectionAction: {
    color: dashboardPalette.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  sectionActionPressable: {
    paddingVertical: 6,
    paddingLeft: 10,
  },
  sectionActionPressed: {
    opacity: 0.6,
  },

  // Recent sections
  recentSection: {
    marginTop: 24,
  },
  transferList: {
    gap: 10,
  },
});
