import { StyleSheet } from "react-native";

/** Shared tokens so components never repeat raw color values. */
export const walletsPalette = {
  primary: "#0A7EA4",
  primarySoftIcon: "rgba(10, 126, 164, 0.12)",
  primarySoftStrong: "rgba(10, 126, 164, 0.08)",
  primaryBorder: "rgba(10, 126, 164, 0.25)",
  onPrimary: "#FFFFFF",
  danger: "#C62828",
} as const;

export const walletsStyles = StyleSheet.create({
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

  // Quick actions (transfer + history) above the wallet list
  quickActions: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
    marginHorizontal: 24,
    marginBottom: 16,
  },
  quickAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  quickActionPrimary: {
    borderColor: walletsPalette.primary,
    backgroundColor: walletsPalette.primary,
  },
  quickActionPressed: {
    opacity: 0.7,
  },
  quickActionText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "700",
    flexShrink: 1,
    textAlign: "center",
  },
  quickActionTextPrimary: {
    color: walletsPalette.onPrimary,
  },

  // Reordering (toggle, hint, error and per-card arrows)
  reorderHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 16,
  },
  reorderToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderColor: walletsPalette.primaryBorder,
    backgroundColor: walletsPalette.primarySoftStrong,
  },
  reorderToggleActive: {
    backgroundColor: walletsPalette.primary,
    borderColor: walletsPalette.primary,
  },
  reorderToggleDisabled: {
    opacity: 0.5,
  },
  reorderTogglePressed: {
    opacity: 0.7,
  },
  reorderToggleText: {
    fontSize: 13,
    fontWeight: "700",
    color: walletsPalette.primary,
  },
  reorderToggleTextActive: {
    color: walletsPalette.onPrimary,
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
    color: walletsPalette.danger,
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
    borderColor: walletsPalette.primaryBorder,
    backgroundColor: walletsPalette.primarySoftStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  reorderButtonDisabled: {
    opacity: 0.35,
  },
});
