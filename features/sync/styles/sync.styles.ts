import { StyleSheet } from "react-native";

import { absoluteFill } from "@/shared/styles/absolute-fill";

/**
 * Layout only: every colour comes from `useFormTheme`, so light and dark mode
 * share one composition. The single raw value is the neutral dialog backdrop,
 * same token the other popups use.
 */
export const syncPalette = {
  backdrop: "rgba(17, 24, 28, 0.5)",
} as const;

export const syncStyles = StyleSheet.create({
  // Settings block
  block: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  blockHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  blockTitle: {
    flex: 1,
  },
  blockLine: {
    fontSize: 13,
    lineHeight: 18,
  },
  blockActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 12,
  },
  retryText: {
    fontSize: 14,
    fontWeight: "700",
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 44,
    paddingHorizontal: 6,
  },
  linkText: {
    fontSize: 13,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.7,
  },

  // Sync center screen
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    gap: 14,
  },
  disabledContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  summaryLine: {
    fontSize: 14,
    lineHeight: 20,
  },
  summaryError: {
    gap: 2,
    marginTop: 2,
  },
  summaryActions: {
    flexDirection: "row",
    marginTop: 6,
  },
  conflictsSection: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  conflictRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  conflictIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  conflictBody: {
    flex: 1,
    gap: 2,
  },
  conflictTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
  },
  conflictMeta: {
    fontSize: 13,
    lineHeight: 18,
  },

  // Conflict dialog
  dialogOverlay: {
    ...absoluteFill,
    justifyContent: "flex-end",
    zIndex: 40,
  },
  dialogBackdrop: {
    ...absoluteFill,
    backgroundColor: syncPalette.backdrop,
  },
  dialogCard: {
    maxHeight: "90%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 28,
    gap: 12,
  },
  dialogHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dialogTitle: {
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
  },
  dialogClose: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginRight: -10,
  },
  dialogDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  dialogBody: {
    flexGrow: 0,
  },
  dialogBodyContent: {
    gap: 10,
  },
  dialogActions: {
    gap: 8,
  },
  actionButton: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  actionPrimaryText: {
    fontSize: 15,
    fontWeight: "700",
  },
  actionSecondaryText: {
    fontSize: 15,
    fontWeight: "600",
  },

  // Snapshot values
  valuesCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  valuesTitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  valueLabel: {
    minWidth: 84,
    fontSize: 13,
    lineHeight: 18,
  },
  valueText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
    fontVariant: ["tabular-nums"],
  },
});
