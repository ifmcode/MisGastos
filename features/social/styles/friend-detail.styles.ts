import { StyleSheet } from "react-native";

/**
 * Layout only: every colour comes from `useFormTheme`, so light and dark mode
 * share the same composition.
 */
export const friendDetailStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
    gap: 18,
  },

  // Header
  header: {
    gap: 10,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  identity: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -12,
  },
  removeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  balances: {
    gap: 2,
  },
  balanceLine: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  settleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
    minHeight: 48,
  },
  settleButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },

  // Shared interaction states
  actionDisabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.7,
  },
});
