import { StyleSheet } from "react-native";

/**
 * Balances of one group. Layout only: every colour comes from `useFormTheme`,
 * and the section shell reuses `groupExpensesStyles` so both sections match.
 */
export const groupBalancesStyles = StyleSheet.create({
  balanceLines: {
    gap: 2,
  },
  balanceLine: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  balanceLineMeta: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  currencyList: {
    gap: 8,
  },
  currencyBlock: {
    gap: 6,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  currencyLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  memberName: {
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  memberAmount: {
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    textAlign: "right",
  },
  debtRow: {
    flexShrink: 1,
    flexGrow: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  debtRowContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 44,
  },
  debtAction: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    minHeight: 44,
  },
  debtActionText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
