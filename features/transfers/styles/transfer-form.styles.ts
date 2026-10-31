import { StyleSheet } from "react-native";

/** Shared tokens so components never repeat raw color values. */
export const transferFormPalette = {
  primary: "#0A7EA4",
  primarySoft: "rgba(10, 126, 164, 0.12)",
  onPrimary: "#FFFFFF",
  danger: "#C62828",
  dangerSoft: "rgba(198, 40, 40, 0.1)",
  dangerSurface: "#FDECEA",
  dangerText: "#8A1C1C",
} as const;

export const transferFormStyles = StyleSheet.create({
  // Layout
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },

  // Feedback
  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: transferFormPalette.dangerSurface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    flex: 1,
    color: transferFormPalette.dangerText,
    fontSize: 14,
    lineHeight: 20,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  fieldError: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
    color: transferFormPalette.danger,
  },
  helper: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },

  // Fields
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 18,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 48,
    fontSize: 16,
  },
  textArea: {
    minHeight: 88,
    paddingTop: 12,
    paddingBottom: 12,
  },
  amountWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 54,
  },
  amountSymbol: {
    fontSize: 18,
    fontWeight: "700",
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: "700",
    paddingVertical: 10,
  },
  descriptionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  counter: {
    fontSize: 12,
    marginTop: 6,
  },

  // Wallet selectors
  walletList: {
    gap: 8,
  },
  walletItem: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  walletItemText: {
    flex: 1,
    marginRight: 10,
  },
  metaText: {
    fontSize: 13,
    marginTop: 2,
  },
  walletBalance: {
    fontSize: 13,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },

  // Actions
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 28,
    flexWrap: "wrap",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: transferFormPalette.dangerSoft,
  },
  deleteButtonText: {
    color: transferFormPalette.danger,
    fontWeight: "600",
  },
  secondaryButton: {
    flex: 1,
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 110,
  },
  primaryButton: {
    flex: 1.4,
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: transferFormPalette.primary,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 130,
  },
  primaryButtonText: {
    color: transferFormPalette.onPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.6,
  },
});
