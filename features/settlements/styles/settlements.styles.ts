import { StyleSheet } from "react-native";

/**
 * Layout only: every colour comes from `useFormTheme`, so light and dark mode
 * share the same composition.
 */
export const settlementsStyles = StyleSheet.create({
  // Screen shell
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    gap: 16,
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
  headerTitle: {
    flex: 1,
    fontSize: 24,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },

  // Debt summary
  debtCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  debtLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  debtDirection: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },

  // Form fields
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 18,
    marginBottom: 8,
  },
  helper: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  fieldError: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  walletPicker: {
    marginTop: 10,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 44,
  },
  optionChipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  optionChipDisabled: {
    opacity: 0.6,
  },
  formNotice: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 18,
  },
  formNoticeText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },

  // Detail
  detailWalletRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
  },
  detailBlock: {
    gap: 8,
    marginTop: 8,
  },
  linkButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  linkButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  detailAction: {
    alignSelf: "flex-start",
    paddingVertical: 6,
  },
  detailActionText: {
    fontSize: 14,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.7,
  },
  actionDisabled: {
    opacity: 0.5,
  },
});
