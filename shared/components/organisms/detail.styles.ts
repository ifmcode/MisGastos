import { StyleSheet } from "react-native";

/** Shared tokens so detail views never repeat raw color values. */
export const detailPalette = {
  primary: "#0A7EA4",
  primarySoft: "rgba(10, 126, 164, 0.12)",
  onPrimary: "#FFFFFF",
} as const;

export const detailStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },

  // Content
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
  },
  content: {
    gap: 16,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    gap: 4,
  },
  summaryType: {
    fontSize: 14,
    fontWeight: "600",
  },
  summaryAmount: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  summaryCurrency: {
    fontSize: 13,
  },
  detailsCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 18,
  },
  fieldRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  fieldRowLast: {
    borderBottomWidth: 0,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    lineHeight: 22,
  },

  // Missing record
  missingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 32,
  },
  missingIcon: {
    width: 70,
    height: 70,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: detailPalette.primarySoft,
  },
  missingTitle: {
    fontSize: 19,
    textAlign: "center",
  },
  missingMessage: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  missingButton: {
    marginTop: 12,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: detailPalette.primary,
  },
  missingButtonText: {
    color: detailPalette.onPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
});
