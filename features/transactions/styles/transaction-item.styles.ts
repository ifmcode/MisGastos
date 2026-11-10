import { StyleSheet } from "react-native";

/** Shared tokens so the movement card never repeats raw color values. */
export const transactionItemPalette = {
  primary: "#0A7EA4",
  primarySoft: "rgba(10, 126, 164, 0.12)",
} as const;

export const transactionItemStyles = StyleSheet.create({
  pressable: {
    borderRadius: 16,
  },
  pressed: {
    opacity: 0.7,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: transactionItemPalette.primarySoft,
  },
  details: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.65,
    marginTop: 2,
  },
  amountColumn: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 15,
    fontVariant: ["tabular-nums"],
  },
  currency: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  editAffordance: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    backgroundColor: transactionItemPalette.primarySoft,
  },
});
